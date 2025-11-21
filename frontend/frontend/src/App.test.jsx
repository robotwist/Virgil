import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders welcome message', () => {
    render(<App />);
    expect(screen.getByText(/welcome to virgil/i)).toBeInTheDocument();
  });

  it('shows proactive reminder in chat', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ reminders: [{ message: 'Test reminder' }] }) }));
    render(<App />);
    await waitFor(() => expect(screen.getByText(/reminder: test reminder/i)).toBeInTheDocument(), { timeout: 12000 });
  });
});
