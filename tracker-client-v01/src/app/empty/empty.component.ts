import { Component, EventEmitter, Output } from '@angular/core';
import { UserService } from '../_services/user.service';
import { MessageService } from '../_services/message.service';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { User } from '../_model/user';

@Component({
  selector: 'app-empty',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './empty.component.html',
})
export class EmptyComponent {}
