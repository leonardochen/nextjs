'use client';

import { ToolInvocation } from 'ai';
import { Message, useChat } from '@ai-sdk/react';

export default function Chat() {
    const { messages, input, handleInputChange, handleSubmit, addToolResult } =
        useChat({
            api: 'api/chat-tools',
            maxToolRoundtrips: 5,

            // run client-side tools that are automatically executed:
            async onToolCall({ toolCall }: { toolCall: ToolInvocation }) {
                if (toolCall.toolName === 'getLocation') {
                    const cities = [
                        'New York',
                        'Los Angeles',
                        'Chicago',
                        'San Francisco',
                    ];
                    return cities[Math.floor(Math.random() * cities.length)];
                }
            },
        });

    return (
        <div>
            {messages?.map((m: Message) => (
                <div key={m.id}>
                    <strong>{m.role}:</strong>
                    {m.content}
                    {m.toolInvocations?.map((toolInvocation: ToolInvocation) => {
                        const toolCallId = toolInvocation.toolCallId;
                        const addResult = (result: string) =>
                            addToolResult({ toolCallId, result });

                        // render confirmation tool (client-side tool with user interaction)
                        if (toolInvocation.toolName === 'askForConfirmation') {
                            return (
                                <div key={toolCallId}>
                                    {toolInvocation.args.message}
                                    <div>
                                        {'result' in toolInvocation ? (
                                            <b>{toolInvocation.result}</b>
                                        ) : (
                                            <>
                                                <button onClick={() => addResult('Yes')}>Yes</button>
                                                <button onClick={() => addResult('No')}>No</button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        }

                        // other tools:
                        return 'result' in toolInvocation ? (
                            <div key={toolCallId}>
                                Tool call {`${toolInvocation.toolName}: `}
                                {toolInvocation.result}
                            </div>
                        ) : (
                            <div key={toolCallId}>Calling {toolInvocation.toolName}...</div>
                        );
                    })}
                    <br />
                </div>
            ))}

            <form onSubmit={handleSubmit}>
                <input value={input} onChange={handleInputChange} className='border border-gray-300 rounded-lg p-2 w-full' />
            </form>
        </div>
    );
}