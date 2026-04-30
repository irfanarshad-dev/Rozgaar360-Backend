import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { NotificationService } from '../services/notification.service';
import { NotificationType } from '../schemas/notification.schema';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: { origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], credentials: true },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private userSockets = new Map<string, string>();
  private typingUsers = new Map<string, Set<string>>();

  constructor(
    private chatService: ChatService,
    private notificationService: NotificationService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        console.log('[ChatGateway] No token provided, disconnecting client');
        client.disconnect();
        return;
      }
      
      console.log('[ChatGateway] Attempting to verify token...');
      const decoded = this.jwtService.verify(token);
      const userId = decoded.sub || decoded._id || decoded.userId;
      
      if (!userId) {
        console.log('[ChatGateway] No userId in token, disconnecting client');
        client.disconnect();
        return;
      }
      
      client.data.userId = userId;
      this.userSockets.set(userId, client.id);
      
      // Join private user room for notifications
      const userRoom = `user-${userId}`;
      client.join(userRoom);
      console.log(`[ChatGateway] User ${userId} joined private room ${userRoom}`);

      this.server.emit('user-online', { userId });
    } catch (err) {
      console.error('[ChatGateway] ✗ Connection error:', err.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.userSockets.delete(userId);
      this.server.emit('user-offline', { userId });
    }
  }

  @SubscribeMessage('join-conversation')
  async handleJoinConversation(client: Socket, data: { conversationId: string }) {
    const roomName = `conversation-${data.conversationId}`;
    console.log('[ChatGateway] ========================================');
    console.log('[ChatGateway] JOIN CONVERSATION REQUEST');
    console.log('[ChatGateway] User:', client.data.userId);
    console.log('[ChatGateway] Room:', roomName);
    console.log('[ChatGateway] Socket ID:', client.id);
    
    client.join(roomName);
    console.log('[ChatGateway] User joined room successfully');
    
    // Send confirmation back to client
    client.emit('joined-conversation', { conversationId: data.conversationId, success: true });
    
    // Log all clients in the room
    const socketsInRoom = await this.server.in(roomName).fetchSockets();
    console.log('[ChatGateway] Total clients in room:', socketsInRoom.length);
    socketsInRoom.forEach(s => {
      console.log('[ChatGateway]   - User:', s.data.userId, 'Socket:', s.id);
    });
    console.log('[ChatGateway] ========================================');
    
    await this.chatService.resetUnreadCount(data.conversationId, client.data.userId);
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    client: Socket,
    data: { conversationId: string; text: string; fileUrls?: string[]; messageType?: string; fileUrl?: string; fileName?: string; fileSize?: number; fileType?: string; voiceUrl?: string; voiceDuration?: number },
  ) {
    const userId = client.data.userId;
    const roomName = `conversation-${data.conversationId}`;

    console.log('[ChatGateway] send-message from:', userId, 'to room:', roomName);

    // Ensure sender is joined to the room (handles reconnects)
    const rooms = client.rooms;
    if (!rooms.has(roomName)) {
      client.join(roomName);
      console.log('[ChatGateway] Auto-joined sender to room:', roomName);
    }

    const conversation = await this.chatService.getConversationById(data.conversationId);
    const recipientId = String(conversation.workerId._id) === String(userId) 
      ? String(conversation.customerId._id) 
      : String(conversation.workerId._id);

    const messageData: any = {};
    if (data.messageType) messageData.messageType = data.messageType;
    if (data.fileUrl) messageData.fileUrl = data.fileUrl;
    if (data.fileName) messageData.fileName = data.fileName;
    if (data.fileSize) messageData.fileSize = data.fileSize;
    if (data.fileType) messageData.fileType = data.fileType;
    if (data.voiceUrl) messageData.voiceUrl = data.voiceUrl;
    if (data.voiceDuration) messageData.voiceDuration = data.voiceDuration;

    const message = await this.chatService.saveMessage(
      data.conversationId,
      userId,
      data.text || '',
      data.fileUrls,
      messageData,
    );

    // Increment unread count for recipient
    const currentUnread = conversation.unreadCount?.get(recipientId) || 0;
    await this.chatService.updateUnreadCount(data.conversationId, recipientId, currentUnread + 1);

    // Check if recipient is currently viewing this conversation
    const socketsInRoom = await this.server.in(roomName).fetchSockets();
    const recipientIsInRoom = socketsInRoom.some(
      (socket) => String(socket.data.userId) === recipientId,
    );

    // Create bell notification ONLY if recipient is not actively viewing this conversation
    if (!recipientIsInRoom) {
      const senderUser = String(conversation.workerId._id) === String(userId)
        ? (conversation.workerId as any)
        : (conversation.customerId as any);
      const recipientUser = recipientId === String(conversation.customerId._id)
        ? (conversation.customerId as any)
        : (conversation.workerId as any);
      const recipientRole = recipientUser?.role || 'customer';
      const chatUrl = recipientRole === 'worker' ? '/worker/chat' : '/customer/chat';

      await this.notificationService.createNotification({
        userId: recipientId,
        type: NotificationType.NEW_MESSAGE,
        title: 'New Message',
        message: `You have a new message from ${senderUser.name || 'Someone'}`,
        conversationId: data.conversationId,
        actionUrl: chatUrl,
      });
    }

    const messageData2 = message.toObject();

    const messagePayload = {
      _id: String(messageData2._id),
      conversationId: String(data.conversationId),
      senderId: String(messageData2.senderId),
      text: messageData2.text || '',
      fileUrls: messageData2.fileUrls || [],
      status: 'sent',
      createdAt: messageData2.createdAt || new Date(),
      messageType: messageData2.messageType,
      fileUrl: messageData2.fileUrl,
      fileName: messageData2.fileName,
      fileSize: messageData2.fileSize,
      fileType: messageData2.fileType,
      voiceUrl: messageData2.voiceUrl,
      voiceDuration: messageData2.voiceDuration,
      reactions: messageData2.reactions || [],
      readBy: messageData2.readBy || [],
    };

    // Emit to conversation room (for active chat window)
    this.server.to(roomName).emit('message-received', messagePayload);

    // Notify both users' sidebars
    this.server.to(`user-${userId}`).emit('conversation-updated', { conversationId: data.conversationId });
    this.server.to(`user-${recipientId}`).emit('conversation-updated', { conversationId: data.conversationId });

    console.log('[ChatGateway] Done.');
  }

  @SubscribeMessage('typing')
  handleTyping(client: Socket, data: { conversationId: string; isTyping: boolean }) {
    const roomId = `conversation-${data.conversationId}`;
    
    if (!this.typingUsers.has(roomId)) {
      this.typingUsers.set(roomId, new Set());
    }

    const typingSet = this.typingUsers.get(roomId);
    if (typingSet) {
      if (data.isTyping) {
        typingSet.add(client.data.userId);
      } else {
        typingSet.delete(client.data.userId);
      }
    }

    this.server.to(roomId).emit('user-typing', {
      userId: client.data.userId,
      isTyping: data.isTyping,
    });
  }

  @SubscribeMessage('message-seen')
  async handleMessageSeen(client: Socket, data: { messageId: string }) {
    await this.chatService.markMessageAsSeen(data.messageId);
    this.server.emit('message-status-updated', {
      messageId: data.messageId,
      status: 'seen',
    });
  }

  @SubscribeMessage('leave-conversation')
  handleLeaveConversation(client: Socket, data: { conversationId: string }) {
    client.leave(`conversation-${data.conversationId}`);
  }

  @SubscribeMessage('message-reaction')
  async handleMessageReaction(
    client: Socket,
    data: { messageId: string; emoji: string; conversationId: string },
  ) {
    const userId = client.data.userId;
    const message = await this.chatService.addReaction(data.messageId, userId, data.emoji);
    
    const roomName = `conversation-${data.conversationId}`;
    this.server.to(roomName).emit('reaction-updated', {
      messageId: data.messageId,
      reactions: message.reactions,
    });
  }

  @SubscribeMessage('messages-read')
  async handleMessagesRead(
    client: Socket,
    data: { conversationId: string },
  ) {
    const userId = client.data.userId;
    const result = await this.chatService.markMessagesAsRead(data.conversationId, userId);
    
    const roomName = `conversation-${data.conversationId}`;
    this.server.to(roomName).emit('messages-read', {
      conversationId: data.conversationId,
      userId,
      count: result.count,
    });
  }

  @SubscribeMessage('delete-message')
  async handleDeleteMessage(
    client: Socket,
    data: { messageId: string; conversationId: string; deleteForEveryone: boolean },
  ) {
    const userId = client.data.userId;
    const result = await this.chatService.deleteMessage(data.messageId, userId, data.deleteForEveryone);
    
    const roomName = `conversation-${data.conversationId}`;
    this.server.to(roomName).emit('message-deleted', {
      messageId: data.messageId,
      deleteForEveryone: data.deleteForEveryone,
      deletedBy: userId,
    });
  }
}
