export function formatToolResult<T extends { success: boolean }>(result: T) {
  const structuredContent = JSON.parse(JSON.stringify(result)) as Record<
    string,
    unknown
  >;
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    structuredContent,
    isError: !result.success,
  };
}
