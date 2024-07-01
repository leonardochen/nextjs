'use client';

import { useAssistant, useChat } from '@ai-sdk/react';

export default function Page() {
  const { messages, input, handleInputChange, append } = useAssistant({
    api: 'api/assistant',
  });

  return (
    <>
      {messages.map(message => (
        <div key={message.id}>
          {message.role === 'user' ? 'User: ' : 'AI: '}
          {message.content}
        </div>
      ))}
      <form onSubmit={append}>
        <input
          name="prompt"
          value={input}
          onChange={handleInputChange}
          id="input"
          className='border border-gray-300 rounded-lg p-2 w-full'
        />
        <button type="submit" className='btn btn-primary'>Submit</button>
      </form>
    </>
  );
}