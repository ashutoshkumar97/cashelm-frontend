import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService } from './transaction.service';
import { Transaction } from './transaction.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  isLoading = false;
  uploadError = '';
  successMessage = '';

  totalIn = 0;
  totalOut = 0;

  searchQuery = '';
  filteredTotalOut = 0;
  filteredPercentage = 0;

  constructor(private transactionService: TransactionService) {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.isLoading = true;
    this.transactionService.getTransactions().subscribe({
      next: (data) => {
        this.transactions = data;
        this.applyFilter();
        this.isLoading = false;
      },
      error: (err) => {
        this.uploadError = 'Failed to load transactions: ' + err.message;
        this.isLoading = false;
      }
    });
  }

  applyFilter(): void {
    if (this.searchQuery.trim() === '') {
      this.filteredTransactions = [...this.transactions];
    } else {
      const query = this.searchQuery.toLowerCase().trim();
      this.filteredTransactions = this.transactions.filter(t =>
        t.description && t.description.toLowerCase().includes(query)
      );
    }
    this.calculateTotals();
  }

  calculateTotals(): void {
    this.totalIn = 0;
    this.totalOut = 0;
    this.transactions.forEach(t => {
      if (t.type === 'CREDIT' || (t.amount > 0 && t.type !== 'DEBIT')) {
        this.totalIn += t.amount;
      } else {
        this.totalOut += Math.abs(t.amount);
      }
    });

    this.filteredTotalOut = 0;
    if (this.searchQuery.trim() !== '') {
      this.filteredTransactions.forEach(t => {
        if (!(t.type === 'CREDIT' || (t.amount > 0 && t.type !== 'DEBIT'))) {
          this.filteredTotalOut += Math.abs(t.amount);
        }
      });
      this.filteredPercentage = this.totalOut > 0 ? (this.filteredTotalOut / this.totalOut) * 100 : 0;
    } else {
      this.filteredPercentage = 0;
    }
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (!file) return;

    this.isLoading = true;
    this.uploadError = '';
    this.successMessage = '';

    this.transactionService.uploadStatement(file).subscribe({
      next: (response) => {
        if (response && response.timeTakenMs) {
          this.successMessage = `Parsed ${response.count} transactions in ${response.timeTakenMs}ms!`;
        }
        if (response && response.transactions) {
          this.transactions = response.transactions;
          this.applyFilter();
          this.isLoading = false;
        } else {
          this.loadTransactions();
        }
        event.target.value = '';
      },
      error: (err) => {
        this.uploadError = 'Upload failed: ' + err.message;
        this.isLoading = false;
        event.target.value = '';
      }
    });
  }

  clearData(): void {
    if (confirm('Are you sure you want to clear all data?')) {
      this.transactionService.clearTransactions().subscribe({
        next: () => {
          this.transactions = [];
          this.applyFilter();
          this.successMessage = 'Data cleared.';
          this.uploadError = '';
        },
        error: (err) => {
          this.uploadError = 'Failed to clear: ' + err.message;
        }
      });
    }
  }
}
