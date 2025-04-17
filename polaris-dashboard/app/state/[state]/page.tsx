"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function StateDetailsRedirect() {
    const params = useParams();
    const router = useRouter();
    const state = typeof params.state === 'string' ? params.state : '';

    useEffect(() => {
        if (state) {
            router.replace(`/state/${state}/details`);
        }
    }, [state, router]);

    return null;
} 