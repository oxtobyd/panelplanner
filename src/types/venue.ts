export interface Venue {
  id: string;
  name: string;
  isOnline: boolean;
  capacity: number;
  availability?: Date[];
}