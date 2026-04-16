import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: { origin: 'http://localhost:3000', credentials: true },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private userSockets = new Map<string, string>();
  private typingUsers = new Map<string, Set<string>>();

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      const decoded = this.jwtService.verify(token);
      client.data.userId = decoded.sub;
      this.userSockets.set(decoded.sub, client.id);
      this.server.emit('user-online', { userId: decoded.sub });
    } catch (err) {
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
    client.join(`conversation-${data.conversationId}`);
    await this.chatService.resetUnreadCount(data.conversationId, client.data.userId);
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    client: Socket,
    data: { conversationId: string; text: string; fileUrls?: string[] },
  ) {
    const message = await this.chatService.saveMessage(
      data.conversationId,
      client.data.userId,
      data.text,
      data.fileUrls,
    );

    const messageData = message.toObject();
    this.server.to(`conversation-${data.conversationId}`).emit('message-received', {
      _id: messageData._id,
      conversationId: messageData.conversationId,
      senderId: messageData.senderId,
      text: messageData.text,
      fileUrls: messageData.fileUrls,
      status: 'sent',
      createdAt: messageData.createdAt || new Date(),
    });
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
}
