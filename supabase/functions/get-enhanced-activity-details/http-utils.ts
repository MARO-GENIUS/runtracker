
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const makeStravaRequest = async (url: string, accessToken: string, retries = 2): Promise<Response> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      if (response.status === 429) {
        const waitTime = Math.pow(2, attempt) * 1000
        if (attempt < retries) {
          await wait(waitTime)
          continue
        }
        throw new Error('Rate limit exceeded')
      }

      if (!response.ok) {
        throw new Error(`Strava API error: ${response.status}`)
      }

      return response
    } catch (error) {
      if (attempt === retries) throw error
      await wait(Math.pow(2, attempt) * 1000)
    }
  }
  throw new Error('Max retries exceeded')
}
