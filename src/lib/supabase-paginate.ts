export type PagedResult<T> = { data: T[] | null; error: { message: string } | null }

const PAGE_SIZE = 1000

export async function fetchAllByRange<T>(
  fetchPage: (from: number, to: number) => Promise<{ data: T[] | null; error: { message?: string } | null }>,
): Promise<PagedResult<T>> {
  const out: T[] = []
  let from = 0

  while (true) {
    const to = from + PAGE_SIZE - 1
    const { data, error } = await fetchPage(from, to)
    if (error) return { data: null, error: { message: error.message ?? 'Erro ao paginar consulta.' } }

    const batch = data ?? []
    out.push(...batch)
    if (batch.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  return { data: out, error: null }
}
