import { Controller, Get, Post, Body, Param, UseGuards, Query, Request, BadRequestException, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChatService } from './chat.service';

@Controller('api/chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

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
    console.log('[ChatController] Conversation found - Worker:', conversation.workerId.toString(), 'Customer:', conversation.customerId.toString());
    
    if (
      conversation.workerId.toString() !== userId &&
      conversation.customerId.toString() !== userId
    ) {
      console.log('[ChatController] Access denied for user:', userId);
      throw new ForbiddenException('Access denied');
    }
    
    return this.chatService.getMessages(conversationId, parseInt(limit), parseInt(skip));
  }
}
