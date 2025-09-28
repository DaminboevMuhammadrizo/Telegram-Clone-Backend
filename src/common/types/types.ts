export interface JwtPayload {
  id: number;
}


export enum MessageType {
  text = 'text',
  audio = 'audio',
  video = 'video',
  img = 'img',
  document = 'document'
}
