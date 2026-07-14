import { pgTable, text, serial, doublePrecision, json, timestamp } from 'drizzle-orm/pg-core';

// Firebase Authenticated Users Table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Menu Products Table
export const products = pgTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  price: doublePrecision('price').notNull(),
  image: text('image'),
  description: text('description'),
});

// Menu Toppings Table
export const toppings = pgTable('toppings', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  price: doublePrecision('price').notNull(),
});

// Employees Table
export const employees = pgTable('employees', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  pin: text('pin').notNull(),
  employeeId: text('employee_id').notNull(),
  permissions: json('permissions').notNull(), // Stores permission arrays, e.g. ["pos", "bar", ...]
  hourlyWage: doublePrecision('hourly_wage').notNull(),
});

// Schedules / Shifts Table
export const schedules = pgTable('schedules', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  userName: text('user_name').notNull(),
  date: text('date').notNull(), // format YYYY-MM-DD
  shift: text('shift').notNull(), // 'A' | 'B'
});

// Orders Table
export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone'),
  items: json('items').notNull(), // Stores order items JSON
  subtotal: doublePrecision('subtotal').notNull(),
  taxAmount: doublePrecision('tax_amount').notNull(),
  tipAmount: doublePrecision('tip_amount').notNull(),
  discount: doublePrecision('discount').notNull(),
  totalPrice: doublePrecision('total_price').notNull(),
  status: text('status').notNull(), // 'Wait' | 'Preparing' | 'Ready' | 'Completed'
  estimatedTime: doublePrecision('estimated_time').notNull(),
  notes: text('notes'),
  paymentMethod: text('payment_method'),
  createdAt: timestamp('created_at').defaultNow(),
});

