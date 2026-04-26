import { Controller, Get, Post, Body, Param, UseGuards, Query, Request, BadRequestException, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChatService } from './chat.service';

@Controller('api/chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

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
}
