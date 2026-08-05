export interface EvidenceStorage {
  save(buffer: Buffer, filename: string, mimeType: string): Promise<string>; // returns servable URL

  read(url: string): Promise<Buffer>; 
}