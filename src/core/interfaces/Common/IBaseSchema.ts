export interface IBaseSchema {
  [key: string]: {
    schema: {
      summary?: string;
      description?: string;
      tags?: string[];
      security?: Array<{ [key: string]: string[] }>;
      params?: object;
      querystring?: object;
      body?: object;
      headers?: object;
      response?: {
        [statusCode: number]: object;
      };
    };
  };
}