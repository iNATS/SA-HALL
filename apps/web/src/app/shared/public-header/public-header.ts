import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-public-header',
  imports: [MatButtonModule, RouterLink, RouterLinkActive],
  templateUrl: './public-header.html',
  styleUrl: './public-header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicHeader {}
