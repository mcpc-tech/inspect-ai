declare module '*.css' {
  const content: string;
  export default content;
}

// Ensure Web Components API is properly typed
interface CustomElementRegistry {
  define(name: string, constructor: CustomElementConstructor, options?: ElementDefinitionOptions): void;
  get(name: string): CustomElementConstructor | undefined;
}
