import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-public-home',
  imports: [MatButtonModule, MatToolbarModule],
  templateUrl: './public-home.html',
  styleUrl: './public-home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicHome {}
