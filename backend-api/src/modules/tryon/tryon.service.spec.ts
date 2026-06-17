import { Test, TestingModule } from '@nestjs/testing';
import { TryonService } from './tryon.service';
import { PythonAiClient } from '../../clients/python-ai.client';

describe('TryonService', () => {
  let service: TryonService;
  let pythonClient: PythonAiClient;

  const mockPythonClient = {
    tryOn: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TryonService,
        {
          provide: PythonAiClient,
          useValue: mockPythonClient,
        },
      ],
    }).compile();

    service = module.get<TryonService>(TryonService);
    pythonClient = module.get<PythonAiClient>(PythonAiClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe llamar a pythonClient.tryOn con los parámetros correctos y devolver respuesta transformada', async () => {
    const personFile = { originalname: 'person.jpg' } as Express.Multer.File;
    const garmentFile = { originalname: 'shirt.jpg' } as Express.Multer.File;

    const garmentType = 'shirt';

    const apiResponse = {
      result_url: 'https://cdn.example.com/result.jpg',
    };

    mockPythonClient.tryOn.mockResolvedValue(apiResponse);

    const result = await service.process(personFile, garmentFile, garmentType);

    expect(pythonClient.tryOn).toHaveBeenCalledWith({
      person: personFile,
      garment: garmentFile,
      garmentType,
    });

    expect(result).toEqual({
      status: 'success',
      result_url: 'https://cdn.example.com/result.jpg',
    });
  });

  it('debe propagar correctamente el result_url aunque cambie el valor', async () => {
    const personFile = {} as Express.Multer.File;
    const garmentFile = {} as Express.Multer.File;

    mockPythonClient.tryOn.mockResolvedValue({
      result_url: 'http://test.com/image.png',
    });

    const result = await service.process(personFile, garmentFile, 'pants');

    expect(result.result_url).toBe('http://test.com/image.png');
    expect(result.status).toBe('success');
  });
});
