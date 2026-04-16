import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { RecommendationsService } from './recommendations.service';
import { User } from '../schemas/user.schema';

describe('RecommendationsService', () => {
  let service: RecommendationsService;
  let mockUserModel: any;

  beforeEach(async () => {
    mockUserModel = {
      find: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      lean: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationsService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<RecommendationsService>(RecommendationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return top workers based on score calculation', async () => {
    const mockWorkers = [
      { _id: '1', name: 'Worker 1', rating: 4.5, reviewCount: 10, skill: 'Electrician', city: 'Lahore' },
      { _id: '2', name: 'Worker 2', rating: 3.8, reviewCount: 25, skill: 'Electrician', city: 'Lahore' },
      { _id: '3', name: 'Worker 3', rating: 4.9, reviewCount: 5, skill: 'Electrician', city: 'Lahore' },
    ];

    mockUserModel.lean.mockResolvedValue(mockWorkers);

    const result = await service.getRecommendations('Lahore', 'Electrician', 2);

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Worker 3'); // Highest rating should be first
    expect(mockUserModel.find).toHaveBeenCalledWith({
      role: 'worker',
      verified: true,
      city: 'Lahore',
      skill: 'Electrician',
    });
  });
});