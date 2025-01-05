export class CommandError extends Error {
    constructor(
        public readonly type: 'INVALID_SYNTAX' | 'INVALID_ARGUMENT' | 'INVALID_SUBCOMMAND' | 'PERMISSION_DENIED' | 'EXECUTION_ERROR',
        message: string,
        public readonly details?: any
    ) {
        super(message);
        this.name = 'CommandError';
    }
}