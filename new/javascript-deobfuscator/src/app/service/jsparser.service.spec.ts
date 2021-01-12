import { TestBed } from '@angular/core/testing';

import { JSParserService } from './j-s-parser.service';

describe('JsparserService', () => {
  let service: JSParserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JSParserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
