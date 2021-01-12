import { TestBed } from '@angular/core/testing';

import { DeobfuscatorService } from './deobfuscator.service';

describe('DeobfuscatorService', () => {
  let service: DeobfuscatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DeobfuscatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
