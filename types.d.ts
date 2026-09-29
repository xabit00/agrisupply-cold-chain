declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}

declare module "papaparse" {
  interface UnparseConfig {
    header?: boolean;
    escapeFormulae?: boolean;
  }

  const Papa: {
    unparse(data: Record<string, unknown>[], config?: UnparseConfig): string;
  };

  export default Papa;
}