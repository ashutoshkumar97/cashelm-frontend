import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Transaction } from '../models/transaction.model';
import { form } from '@angular/forms/signals';

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  private apiUrl = 'http://localhost:8080/api';

  private transactionSubject = new BehaviorSubject<Transaction[]>([]);
  
  transactions$ = this.transactionSubject.asObservable();

  constructor(private http: HttpClient) {}

  uploadStatement(file: File, password?: string): Observable<Transaction[]> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    if (password) {
      formData.append('password', password);
    }

    return this.http.post<Transaction[]>(`${this.apiUrl}/upload`, formData).pipe(
      tap((transactions) => {
        this.transactionSubject.next(transactions);
      }),
    );
  }
}
