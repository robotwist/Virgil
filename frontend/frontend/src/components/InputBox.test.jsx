import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import InputBox from './InputBox';

describe('InputBox', () => {
  it('renders input and send button', () => {
    render(<InputBox sendMessage={jest.fn()} isLoading={false} messages={[]} tone="default" setTone={jest.fn()} lastResponse="" />);
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('calls sendMessage when send button is clicked', () => {
    const sendMessage = jest.fn();
    render(<InputBox sendMessage={sendMessage} isLoading={false} messages={[]} tone="default" setTone={jest.fn()} lastResponse="" />);
    fireEvent.change(screen.getByPlaceholderText('Type your message...'), { target: { value: 'Hello' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    expect(sendMessage).toHaveBeenCalledWith('Hello');
  });

  it('schedules a reminder', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
    render(<InputBox sendMessage={jest.fn()} isLoading={false} messages={[]} tone="default" setTone={jest.fn()} lastResponse="" />);
    fireEvent.change(screen.getByPlaceholderText('Reminder message...'), { target: { value: 'Test reminder' } });
    fireEvent.change(screen.getByDisplayValue(''), { target: { value: '2099-12-31T23:59' } });
    fireEvent.click(screen.getByRole('button', { name: /set reminder/i }));
    await waitFor(() => expect(screen.getByText(/reminder scheduled/i)).toBeInTheDocument());
  });
});
