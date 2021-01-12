import { TestBed } from '@angular/core/testing';

import { JSgeneratorService } from './j-sgenerator.service';

describe('JsgeneratorService', () => {
  let service: JSgeneratorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JSgeneratorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
