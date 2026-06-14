import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionService } from './services/transaction.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
})
export class AppComponent {
  isLoading = false;
  uploadError = '';
  successMessage = '';

  constructor(private transactionService: TransactionService) {}

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (!file) return;

    this.isLoading = true;
    this.uploadError = '';
    this.successMessage = '';

    this.transactionService.uploadStatement(file).subscribe({
      next: (response) => {
        this.successMessage = `Parsed ${response.count} transactions in ${response.timeTakenMs}ms!`;

        this.isLoading = false;

        event.target.value = '';
      },
      error: (err) => {
        this.uploadError = 'Upload failed: ' + err.message;
        this.isLoading = false;
        event.target.value = '';
      },
    });
  }
}
