import { createContext, useContext, useRef, useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import type { SocketStatus } from "../objects/socketstatus";

interface WebSocketProps {
    url: string;
    children: ReactNode;
}

interface WebSocketContextType {
    sendFrame: (frame: ArrayBuffer) => boolean;
    getWebSocket: () => WebSocket | null;
    getConnectionStatus: () => SocketStatus;
    getAcknowledged: () => boolean;
    getData: () => object | null;
    getDataVersion: () => number;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider = ({ url, children }: WebSocketProps) => {
    const wsRef = useRef<WebSocket | null>(null);
    const retryTimeoutRef = useRef<number | null>(null);
    const acknowledgedRef = useRef<boolean>(true);
    const dataRef = useRef<object | null>(null);
    const dataVersionRef = useRef<number>(0);
    const fallbackCounterRef = useRef<number>(0);
    const RECONNECT_INTERVAL = 3000;

    const connectWebSocket = () => {
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
            if (retryTimeoutRef.current) {
                clearInterval(retryTimeoutRef.current);
                retryTimeoutRef.current = null;
            }
        };

        ws.onclose = () => {
            wsRef.current = null;
        };

        ws.onerror = () => {
            ws.close();
        };

        ws.onmessage = async (event) => {
            let messageText = "";
            if (typeof event.data === "string") {
                messageText = event.data;
            } else if (event.data instanceof Blob) {
                messageText = await event.data.text();
            }

            try {
                const data = JSON.parse(messageText);
                if (data) {
                    // Disable verbose per-message logging for performance
                    dataRef.current = data;
                    acknowledgedRef.current = true;
                    dataVersionRef.current += 1;
                }
            } catch {
                // ignore parse errors
            }
        };
    };

    const retryConnection = () => {
        if (retryTimeoutRef.current) return;
        const timeout = window.setInterval(() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                retryTimeoutRef.current = null;
                clearInterval(timeout);
                return;
            }
            if (!wsRef.current) connectWebSocket();
        }, RECONNECT_INTERVAL);
        retryTimeoutRef.current = timeout;
    };

    useEffect(() => {
        if (!wsRef.current) connectWebSocket();
        const fallback = window.setInterval(() => {
            if (!wsRef.current && !retryTimeoutRef.current) retryConnection();
            fallbackCounterRef.current += 66;
            if (fallbackCounterRef.current > 5000) {
                acknowledgedRef.current = true;
                fallbackCounterRef.current = 0;
            }
        }, 66);
        return () => {
            clearInterval(fallback);
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [url]);

    const sendFrame = (frame: ArrayBuffer): boolean => {
        const socket = wsRef.current;
        if (!socket || socket.readyState !== WebSocket.OPEN) return false;
        socket.send(frame);
        acknowledgedRef.current = false;
        return true;
    };

    const getConnectionStatus = (): SocketStatus => {
        const socket = wsRef.current;
        if (!socket) return "Disconnected";
        switch (socket.readyState) {
            case WebSocket.CONNECTING:
                return "Connecting...";
            case WebSocket.OPEN:
                return "Connected";
            case WebSocket.CLOSING:
                return "Disconnected";
            case WebSocket.CLOSED:
                return "Disconnected";
            default:
                return "Disconnected";
        }
    };

    const value = useMemo<WebSocketContextType>(
        () => ({
            sendFrame,
            getWebSocket: () => wsRef.current,
            getConnectionStatus,
            getAcknowledged: () => acknowledgedRef.current,
            getData: () => dataRef.current,
            getDataVersion: () => dataVersionRef.current,
        }),
        []
    );

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => {
    const ctx = useContext(WebSocketContext);
    if (!ctx)
        throw new Error("useWebSocket must be used within a WebSocketProvider");
    return ctx;
};
