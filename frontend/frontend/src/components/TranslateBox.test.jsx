import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TranslateBox from './TranslateBox';

describe('TranslateBox', () => {
  it('renders translation UI', () => {
    render(<TranslateBox />);
    expect(screen.getByPlaceholderText(/text to translate/i)).toBeInTheDocument();
    expect(screen.getByText(/translate/i)).toBeInTheDocument();
  });

  it('shows translated text after translation', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ translated: 'Hola' }) }));
    render(<TranslateBox />);
    fireEvent.change(screen.getByPlaceholderText(/text to translate/i), { target: { value: 'Hello' } });
    fireEvent.click(screen.getByText(/translate/i));
    await waitFor(() => expect(screen.getByText('Hola')).toBeInTheDocument());
  });
});
