"use client"

import { Calendar } from "@/components/ui/calendar"
import React, { useState } from 'react';

export default function Home() {
    const [date, setDate] = useState<Date | undefined>(new Date())

    return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
        />
    </main>
  );
}
