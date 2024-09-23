import db from '@/db'

export async function refreshProgressMaterializedView() {
  try {
    await db.raw('REFRESH MATERIALIZED VIEW progress_materialized_view');
    console.log('Materialized view refreshed successfully');
  } catch (error) {
    console.error('Error refreshing materialized view:', error);
  }
}
