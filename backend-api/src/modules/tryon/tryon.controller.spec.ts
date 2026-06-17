import { Test, TestingModule } from '@nestjs/testing';
import { TryonController } from './tryon.controller';
import { TryonService } from './tryon.service';

describe('TryonController', () => {
  let controller: TryonController;
  let service: TryonService;

  const mockTryonService = {
    process: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TryonController],
      providers: [
        {
          provide: TryonService,
          useValue: mockTryonService,
        },
      ],
    }).compile();

    controller = module.get<TryonController>(TryonController);
    service = module.get<TryonService>(TryonService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe llamar a tryonService.process con los archivos y el body correcto', async () => {
    const personFile = { originalname: 'person.jpg' } as Express.Multer.File;
    const garmentFile = { originalname: 'garment.jpg' } as Express.Multer.File;

    const files = {
      person_image: [personFile],
      garment_image: [garmentFile],
    };

    const body = {
      garment_type: 'shirt',
    };

    const expectedResponse = { success: true };

    mockTryonService.process.mockResolvedValue(expectedResponse);

    const result = await controller.tryOn(files, body);

    expect(service.process).toHaveBeenCalledWith(
      personFile,
      garmentFile,
      'shirt',
    );

    expect(result).toEqual(expectedResponse);
  });

  it('debe manejar archivos undefined correctamente', async () => {
    const files = {};
    const body = { garment_type: 'pants' };

    mockTryonService.process.mockResolvedValue({ ok: true });

    await controller.tryOn(files as any, body);

    expect(service.process).toHaveBeenCalledWith(undefined, undefined, 'pants');
  });
});
