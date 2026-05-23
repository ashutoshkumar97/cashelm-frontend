import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TransactionService } from './transaction.service';
import { Transaction } from './transaction.model';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'Bank Statement Analyzer';
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

  private chart: Chart | null = null;

  constructor(private transactionService: TransactionService) {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.isLoading = true;
    this.transactionService.getTransactions().subscribe({
      next: (data) => {
        try {
          this.transactions = data;
          this.applyFilter();
          this.isLoading = false;
        } catch (e: any) {
          this.uploadError = 'Frontend calculation error: ' + e.message;
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('Error fetching transactions', err);
        this.uploadError = 'Backend fetch error: ' + err.message;
        this.isLoading = false;
      }
    });
  }

  applyFilter(): void {
    if (!this.searchQuery || this.searchQuery.trim() === '') {
      this.filteredTransactions = [...this.transactions];
    } else {
      const query = this.searchQuery.toLowerCase().trim();
      this.filteredTransactions = this.transactions.filter(t => 
        t.description && t.description.toLowerCase().includes(query)
      );
    }
    this.calculateTotals();
    setTimeout(() => {
      this.renderChart();
    }, 100);
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
    if (this.searchQuery && this.searchQuery.trim() !== '') {
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
    if (file) {
      this.isLoading = true;
      this.uploadError = '';
      this.successMessage = '';
      this.transactionService.uploadStatement(file).subscribe({
        next: (response) => {
          try {
            console.log('Upload response received:', response);
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
          } catch (e: any) {
            console.error('Frontend error after upload:', e);
            this.uploadError = 'Frontend calculation error: ' + e.message;
            this.isLoading = false;
          }
          event.target.value = ''; // Clear value
        },
        error: (err) => {
          console.error('Upload failed', err);
          this.uploadError = 'Upload failed: ' + err.message;
          this.isLoading = false;
          event.target.value = ''; // Clear value
        }
      });
    } else {
      event.target.value = ''; // Clear value
    }
  }

  clearData(): void {
    if (confirm('Are you sure you want to clear all data?')) {
      this.transactionService.clearTransactions().subscribe({
        next: () => {
          this.transactions = [];
          this.applyFilter();
          this.successMessage = 'Data cleared successfully.';
          this.uploadError = '';
        },
        error: (err) => {
          console.error('Failed to clear data', err);
          this.uploadError = 'Failed to clear data: ' + err.message;
        }
      });
    }
  }

  renderChart(): void {
    const canvas = document.getElementById('categoryChart') as HTMLCanvasElement;
    if (!canvas) return;

    // Destroy existing chart if it exists
    if (this.chart) {
      this.chart.destroy();
    }

    // Only map OUTGOING transactions (DEBIT)
    const debits = this.filteredTransactions.filter(t => !(t.type === 'CREDIT' || (t.amount > 0 && t.type !== 'DEBIT')));
    
    if (debits.length === 0) {
      return; // Nothing to chart
    }

    // Aggregate by category
    const categoryMap = new Map<string, number>();
    debits.forEach(t => {
      let category = 'UNCATEGORIZED';
      if (t.description) {
        const parts = t.description.split('-');
        if (parts.length > 1) {
          // Take the last part after the hyphen
          category = parts[parts.length - 1].trim().toUpperCase();
        }
      }
      
      const amount = Math.abs(t.amount);
      categoryMap.set(category, (categoryMap.get(category) || 0) + amount);
    });

    // Sort categories by amount descending
    const sortedCategories = Array.from(categoryMap.entries()).sort((a, b) => b[1] - a[1]);
    
    // Top 10 categories, others grouped into "OTHER"
    const topN = 10;
    const labels = [];
    const data = [];
    let otherSum = 0;

    for (let i = 0; i < sortedCategories.length; i++) {
      if (i < topN) {
        labels.push(sortedCategories[i][0]);
        data.push(sortedCategories[i][1]);
      } else {
        otherSum += sortedCategories[i][1];
      }
    }

    if (otherSum > 0) {
      labels.push('OTHER');
      data.push(otherSum);
    }

    // Generate colors
    const colors = [
      'rgba(99, 102, 241, 0.8)', // Indigo
      'rgba(236, 72, 153, 0.8)', // Pink
      'rgba(16, 185, 129, 0.8)', // Emerald
      'rgba(245, 158, 11, 0.8)', // Amber
      'rgba(59, 130, 246, 0.8)', // Blue
      'rgba(139, 92, 246, 0.8)', // Violet
      'rgba(239, 68, 68, 0.8)',  // Red
      'rgba(14, 165, 233, 0.8)', // Sky
      'rgba(249, 115, 22, 0.8)', // Orange
      'rgba(20, 184, 166, 0.8)', // Teal
      'rgba(107, 114, 128, 0.8)' // Gray (Other)
    ];

    this.chart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors.slice(0, labels.length),
          borderColor: 'rgba(0,0,0,0.5)',
          borderWidth: 2,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: '#9ca3af',
              font: {
                family: 'Inter, sans-serif'
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed !== null) {
                  label += new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(context.parsed);
                }
                return label;
              }
            }
          }
        }
      }
    });
  }
}
