import '../../styles/pages/updates.scss'

const POSTS = [
  {
    id: '2026-05-01',
    date: 'May 1, 2026',
    title: 'Scans are easier to follow and easier to clean up',
    paragraphs: [
      'You can now scan from multiple source libraries at once, revisit older scans from a dedicated history page, and reopen the exact result you left behind. Active scans stay visible while they run, and completed scans are much easier to review later without losing the context of what was suggested.',
      'The proposal flow is also safer for people who like to keep their sources tidy. You can now decide whether selected tracks should be removed from the original source libraries after they are organized into their new homes. That option stays off by default, and if you do use it, Undo can restore those tracks from scan history.',
      'We also tightened up the scan experience itself. The progress screen is now focused on the step sequence instead of multiple competing progress bars, source limits are clearer before a scan starts, and suggestion groups surface the biggest playlist ideas first so strong matches are easier to spot.',
    ],
  },
  {
    id: '2026-04-24',
    date: 'April 24, 2026',
    title: 'Playlist suggestions feel more intentional',
    paragraphs: [
      'Recent updates made the suggestion review calmer and more deliberate. Existing playlists and brand-new playlist ideas are easier to compare side by side, and track-level selection gives you finer control when a playlist is almost right but still needs a few exclusions.',
      'The goal of these changes is simple: less second-guessing, fewer accidental edits, and a smoother path from interesting tag clusters to a playlist structure you actually want to keep.',
    ],
  },
]

export default function UpdatesPage() {
  return (
    <div className="updates-page">
      <header className="updates-page__hero">
        <div>
          <p className="updates-page__eyebrow">Product updates</p>
          <h1 className="updates-page__title">What changed in Spotify Sort</h1>
          <p className="updates-page__subtitle">
            Short release notes focused on what feels different when you use the app, without the implementation detail.
          </p>
        </div>
      </header>

      <div className="updates-page__list">
        {POSTS.map(post => (
          <article key={post.id} className="updates-page__post">
            <p className="updates-page__date">{post.date}</p>
            <h2 className="updates-page__post-title">{post.title}</h2>
            {post.paragraphs.map(paragraph => (
              <p key={paragraph} className="updates-page__post-copy">{paragraph}</p>
            ))}
          </article>
        ))}
      </div>
    </div>
  )
}