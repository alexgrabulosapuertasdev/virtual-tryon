import { Test, TestingModule } from '@nestjs/testing';
import { PythonAiClient } from './python-ai.client';
import { ConfigService } from '@nestjs/config';

describe('PythonAiClient', () => {
  let client: PythonAiClient;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockFetch = jest.fn();

  beforeAll(() => {
    global.fetch = mockFetch as any;
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PythonAiClient,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    client = module.get<PythonAiClient>(PythonAiClient);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe construir FormData, llamar fetch y devolver JSON', async () => {
    const person = {
      buffer: Buffer.from('person-image'),
      originalname: 'person.jpg',
    } as Express.Multer.File;

    const garment = {
      buffer: Buffer.from('garment-image'),
      originalname: 'shirt.jpg',
    } as Express.Multer.File;

    mockConfigService.get.mockReturnValue('http://api-python.com');

    const fakeJson = {
      result_url: 'http://cdn.com/result.jpg',
    };

    mockFetch.mockResolvedValue({
      json: jest.fn().mockResolvedValue(fakeJson),
    });

    const result = await client.tryOn({
      person,
      garment,
      garmentType: 'shirt',
    });

    expect(configService.get).toHaveBeenCalledWith('API_IA_URL');

    expect(mockFetch).toHaveBeenCalled();

    const [url, options] = mockFetch.mock.calls[0];

    expect(url).toBe('http://api-python.com/tryon');
    expect(options.method).toBe('POST');
    expect(options.body).toBeDefined();

    expect(result).toEqual(fakeJson);
  });

  it('debe llamar fetch con FormData válido', async () => {
    mockConfigService.get.mockReturnValue('http://api.com');

    mockFetch.mockResolvedValue({
      json: jest.fn().mockResolvedValue({ ok: true }),
    });

    await client.tryOn({
      person: { buffer: Buffer.from('a'), originalname: 'a.jpg' },
      garment: { buffer: Buffer.from('b'), originalname: 'b.jpg' },
      garmentType: 'pants',
    } as any);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, options] = mockFetch.mock.calls[0];

    // Solo verificamos que exista FormData en el body
    expect(options.body).toBeDefined();
  });
});
