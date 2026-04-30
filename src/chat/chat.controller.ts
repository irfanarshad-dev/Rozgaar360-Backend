import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Query, Request, BadRequestException, InternalServerErrorException, ForbiddenException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Controller('api/chat')
export class ChatController {
  constructor(
    private chatService: ChatService,
    private chatGateway: ChatGateway,
  ) {}

  @Post('conversations')
  @UseGuards(AuthGuard('jwt'))
  async createConversation(
    @Body() body: { jobId?: string; workerId: string; customerId: string },
    @Request() req: any,
  ) {
    const userId = req.user._id.toString();
    const { jobId, workerId, customerId } = body;
    
    console.log('[ChatController] Creating conversation - userId:', userId, 'workerId:', workerId, 'customerId:', customerId);
    
    // Verify user is either the worker or customer
    if (userId !== workerId && userId !== customerId) {
      throw new ForbiddenException('You can only create conversations for yourself');
    }
    
    // Use empty ObjectId if jobId is not provided
    const jobIdToUse = jobId || new (require('mongoose').Types.ObjectId)().toString();
    
    const conversation = await this.chatService.getOrCreateConversation(
      jobIdToUse,
      workerId,
      customerId,
    );
    
    // Populate the conversation with user details
    const conversationId = (conversation._id as any).toString();
    const populatedConversation = await this.chatService.getConversationById(conversationId);
    
    console.log('[ChatController] Conversation created/found:', populatedConversation._id);
    
    return populatedConversation;
  }

  @Get('conversations')
  @UseGuards(AuthGuard('jwt'))
  async getConversations(@Request() req: any) {
    const userId = req.user._id.toString();
    return this.chatService.getConversations(userId);
  }

  @Get('conversations/:conversationId/messages')
  @UseGuards(AuthGuard('jwt'))
  async getMessages(
    @Param('conversationId') conversationId: string,
    @Query('limit') limit = '50',
    @Query('skip') skip = '0',
    @Request() req: any,
  ) {
    const userId = req.user._id.toString();
    console.log('[ChatController] Getting messages for conversation:', conversationId, 'user:', userId);
    
    const conversation = await this.chatService.getConversationById(conversationId);
    console.log('[ChatController] Conversation found - Worker:', conversation.workerId, 'Customer:', conversation.customerId);
    
    const workerIdStr = typeof conversation.workerId === 'object' && conversation.workerId._id 
      ? conversation.workerId._id.toString() 
      : conversation.workerId.toString();
    const customerIdStr = typeof conversation.customerId === 'object' && conversation.customerId._id
      ? conversation.customerId._id.toString()
      : conversation.customerId.toString();
    
    if (workerIdStr !== userId && customerIdStr !== userId) {
      console.log('[ChatController] Access denied for user:', userId);
      throw new ForbiddenException('Access denied');
    }
    
    const messages = await this.chatService.getMessages(conversationId, parseInt(limit), parseInt(skip));
    
    return {
      messages,
      conversation: {
        _id: conversation._id,
        workerId: workerIdStr,
        customerId: customerIdStr,
        workerName: typeof conversation.workerId === 'object' ? (conversation.workerId as any).name : 'Worker',
        customerName: typeof conversation.customerId === 'object' ? (conversation.customerId as any).name : 'Customer',
      }
    };
  }

  @Post('conversations/:conversationId/messages')
  @UseGuards(AuthGuard('jwt'))
  async sendMessage(
    @Param('conversationId') conversationId: string,
    @Body() body: { text: string; fileUrls?: string[] },
    @Request() req: any,
  ) {
    const userId = req.user._id.toString();
    console.log('[ChatController] Sending message to conversation:', conversationId, 'from user:', userId);
    
    // Verify user is part of conversation
    const conversation = await this.chatService.getConversationById(conversationId);
    const workerIdStr = typeof conversation.workerId === 'object' && conversation.workerId._id 
      ? conversation.workerId._id.toString() 
      : conversation.workerId.toString();
    const customerIdStr = typeof conversation.customerId === 'object' && conversation.customerId._id
      ? conversation.customerId._id.toString()
      : conversation.customerId.toString();
    
    if (workerIdStr !== userId && customerIdStr !== userId) {
      throw new ForbiddenException('Access denied');
    }
    
    const message = await this.chatService.saveMessage(
      conversationId,
      userId,
      body.text,
      body.fileUrls,
    );
    
    return message;
  }

  @Post('upload')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('conversationId') conversationId: string,
    @Request() req: any,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    if (!conversationId) throw new BadRequestException('Conversation ID required');

    const userId = req.user._id.toString();
    const conversation = await this.chatService.getConversationById(conversationId);
    const workerIdStr = typeof conversation.workerId === 'object' && conversation.workerId._id 
      ? conversation.workerId._id.toString() 
      : conversation.workerId.toString();
    const customerIdStr = typeof conversation.customerId === 'object' && conversation.customerId._id
      ? conversation.customerId._id.toString()
      : conversation.customerId.toString();
    
    if (workerIdStr !== userId && customerIdStr !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('File must be under 10MB');
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only images, PDF and Word files allowed');
    }

    try {
      const isImage = file.mimetype.startsWith('image/');
      const folder = isImage ? 'chat/images' : 'chat/files';
      const resourceType = isImage ? 'image' : 'raw';

      // Upload to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: resourceType,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        );

        const bufferStream = new Readable();
        bufferStream.push(file.buffer);
        bufferStream.push(null);
        bufferStream.pipe(uploadStream);
      });

      const fileType = isImage ? 'image' : file.mimetype === 'application/pdf' ? 'pdf' : 'doc';
      const fileUrl = (uploadResult as any).secure_url;
      const fileName = file.originalname;
      const fileSize = file.size;

      // Save message to database
      const message = await this.chatService.saveMessage(
        conversationId,
        userId,
        fileName, // fallback text
        [],
        {
          fileUrl,
          fileName,
          fileSize,
          fileType,
          messageType: 'file',
        },
      );

      const messageObj = message.toObject ? message.toObject() : message;

      console.log('[ChatController] Message saved to DB:', {
        _id: messageObj._id,
        fileUrl: messageObj.fileUrl,
        fileName: messageObj.fileName,
        fileSize: messageObj.fileSize,
        fileType: messageObj.fileType,
        messageType: messageObj.messageType,
      });

      // Emit socket event to conversation room
      const roomName = `conversation-${conversationId}`;
      const messagePayload = {
        _id: String(messageObj._id),
        conversationId: String(messageObj.conversationId),
        senderId: String(messageObj.senderId),
        senderName: messageObj.senderName,
        text: messageObj.text || '',
        fileUrl: messageObj.fileUrl,
        fileName: messageObj.fileName,
        fileSize: messageObj.fileSize,
        fileType: messageObj.fileType,
        messageType: messageObj.messageType,
        createdAt: messageObj.createdAt,
        status: 'sent',
      };

      this.chatGateway.server.to(roomName).emit('message-received', messagePayload);

      // Notify both users' sidebars
      const recipientId = workerIdStr === userId ? customerIdStr : workerIdStr;
      this.chatGateway.server.to(`user-${userId}`).emit('conversation-updated', { conversationId });
      this.chatGateway.server.to(`user-${recipientId}`).emit('conversation-updated', { conversationId });

      console.log('[ChatController] File uploaded and message saved:', messageObj._id);

      return {
        success: true,
        message: {
          _id: String(messageObj._id),
          senderName: messageObj.senderName,
          fileUrl: messageObj.fileUrl,
          fileName: messageObj.fileName,
          fileSize: messageObj.fileSize,
          fileType: messageObj.fileType,
          messageType: messageObj.messageType,
          createdAt: messageObj.createdAt,
        },
      };
    } catch (error) {
      console.error('[ChatController] Upload error:', error);
      throw new InternalServerErrorException('Upload failed');
    }
  }

  @Post('voice')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('audio'))
  async uploadVoice(
    @UploadedFile() file: Express.Multer.File,
    @Body('conversationId') conversationId: string,
    @Body('duration') duration: string,
    @Request() req: any,
  ) {
    if (!file) throw new BadRequestException('No audio file provided');
    if (!conversationId) throw new BadRequestException('Conversation ID required');

    const userId = req.user._id.toString();
    const conversation = await this.chatService.getConversationById(conversationId);
    const workerIdStr = typeof conversation.workerId === 'object' && conversation.workerId._id 
      ? conversation.workerId._id.toString() 
      : conversation.workerId.toString();
    const customerIdStr = typeof conversation.customerId === 'object' && conversation.customerId._id
      ? conversation.customerId._id.toString()
      : conversation.customerId.toString();
    
    if (workerIdStr !== userId && customerIdStr !== userId) {
      throw new ForbiddenException('Access denied');
    }

    try {
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'chat/voice',
            resource_type: 'video', // Cloudinary uses 'video' for audio
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        );

        const bufferStream = new Readable();
        bufferStream.push(file.buffer);
        bufferStream.push(null);
        bufferStream.pipe(uploadStream);
      });

      return {
        voiceUrl: (uploadResult as any).secure_url,
        voiceDuration: parseFloat(duration) || 0,
      };
    } catch (error) {
      console.error('[ChatController] Voice upload error:', error);
      throw new InternalServerErrorException('Voice upload failed');
    }
  }

  @Patch('messages/:messageId/reaction')
  @UseGuards(AuthGuard('jwt'))
  async addReaction(
    @Param('messageId') messageId: string,
    @Body('emoji') emoji: string,
    @Request() req: any,
  ) {
    if (!emoji) throw new BadRequestException('Emoji required');
    const userId = req.user._id.toString();
    const message = await this.chatService.addReaction(messageId, userId, emoji);
    return message;
  }

  @Patch('messages/read/:conversationId')
  @UseGuards(AuthGuard('jwt'))
  async markAsRead(
    @Param('conversationId') conversationId: string,
    @Request() req: any,
  ) {
    const userId = req.user._id.toString();
    const result = await this.chatService.markMessagesAsRead(conversationId, userId);
    return result;
  }

  @Get('conversations/:conversationId/search')
  @UseGuards(AuthGuard('jwt'))
  async searchMessages(
    @Param('conversationId') conversationId: string,
    @Query('q') query: string,
    @Request() req: any,
  ) {
    if (!query) throw new BadRequestException('Search query required');
    
    const userId = req.user._id.toString();
    const conversation = await this.chatService.getConversationById(conversationId);
    const workerIdStr = typeof conversation.workerId === 'object' && conversation.workerId._id 
      ? conversation.workerId._id.toString() 
      : conversation.workerId.toString();
    const customerIdStr = typeof conversation.customerId === 'object' && conversation.customerId._id
      ? conversation.customerId._id.toString()
      : conversation.customerId.toString();
    
    if (workerIdStr !== userId && customerIdStr !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.chatService.searchMessages(conversationId, query);
  }

  @Delete('messages/:messageId')
  @UseGuards(AuthGuard('jwt'))
  async deleteMessage(
    @Param('messageId') messageId: string,
    @Body('deleteForEveryone') deleteForEveryone: boolean,
    @Request() req: any,
  ) {
    const userId = req.user._id.toString();
    const result = await this.chatService.deleteMessage(messageId, userId, deleteForEveryone);
    return result;
  }
}
