import { Component, OnInit } from '@angular/core';
import {DeobfuscatorService} from '../service/deobfuscator.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {

  constructor(private deobfuscator: DeobfuscatorService) { }

  obfuscatedCode = '';
  deobfuscatedCode = 'let test = "hola" + 3;';

  triggerDeobfuscate(): void{
    this.deobfuscatedCode = this.deobfuscator.deobfuscate(this.obfuscatedCode);
  }

  ngOnInit(): void {}

  reset(): void {
    this.obfuscatedCode = '';
    this.deobfuscatedCode = '';
  }
}
