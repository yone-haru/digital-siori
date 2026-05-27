import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

type BookRow = {
  title: string;
  author: string;
  status: string;
  rating: number | null;
  created_at: string;
  finished_at: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  reading: '読書中',
  rereading: '再読中',
  to_read: '未読',
  finished: '読書完了',
};

function escapeCsv(val: string | null | undefined): string {
  const s = val ?? '';
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function exportBooksCSV(books: BookRow[]): Promise<void> {
  const header = ['タイトル', '著者', 'ステータス', '評価', '登録日', '完了日'].join(',');
  const rows = books.map((b) => [
    escapeCsv(b.title),
    escapeCsv(b.author),
    escapeCsv(STATUS_LABEL[b.status] ?? b.status),
    b.rating != null ? String(b.rating) : '',
    b.created_at.slice(0, 10),
    b.finished_at ? b.finished_at.slice(0, 10) : '',
  ].join(','));

  const csv = [header, ...rows].join('\n');
  const path = (FileSystem.cacheDirectory ?? '') + 'digital_shiori_books.csv';
  await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(path, { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text' });
  }
}
