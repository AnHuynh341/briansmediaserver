// ==========================================================
// W41IT VIDEO MODE
// ==========================================================
// The UI is currently driven by the real VPS-backed catalog below.
// anime-add and youtube-add publish directly into the two catalog arrays below.

const VIDEO_MEDIA_ORIGIN = 'https://media.anhuynh341.online';

function resolveVideoMediaUrl(path) {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    const normalizedPath = String(path).startsWith('/') ? String(path) : `/${path}`;
    return `${VIDEO_MEDIA_ORIGIN}${normalizedPath}`;
}

function getVideoSeriesPoster(series) {
    return series.posterPath ? resolveVideoMediaUrl(series.posterPath) : series.poster;
}

function getVideoSeriesBackdrop(series) {
    return series.backdropPath
        ? resolveVideoMediaUrl(series.backdropPath)
        : (series.backdrop || getVideoSeriesPoster(series));
}

const VIDEO_SERIES = [
    {
        id: 'smoking-behind-supermarket',
        title: 'Smoking Behind the Supermarket with You',
        year: 2026,
        genre: 'Drama',
        posterPath: "/anime/Smoking%20Behind%20the%20Supermarket%20with%20You/series-thumbnail.jpg?v=90be3b8c49ba",
        backdropPath: "/anime/Smoking%20Behind%20the%20Supermarket%20with%20You/series-thumbnail.jpg?v=90be3b8c49ba",
        description: 'VPS-backed video library. Video, artwork and subtitles are served from the W41IT media origin.',
        episodes: [
                        {
                number: 1,
                title: "Smoking Behind the Supermarket with You",
                duration: "23:53",
                quality: "720p",
                thumbnailPath: "/anime/Smoking%20Behind%20the%20Supermarket%20with%20You/S01E01/thumbnail.jpg",
                videoPath: "/anime/Smoking%20Behind%20the%20Supermarket%20with%20You/S01E01/video.mp4",
                subtitles: [
                    {
                        lang: "en",
                        label: "English (CR)",
                        path: "/anime/Smoking%20Behind%20the%20Supermarket%20with%20You/S01E01/en.vtt",
                        default: true
                    }
                ]
            },
            {
                number: 2,
                title: "Cheering Up Behind the Supermarket with You",
                duration: "23:50",
                quality: "720p",
                thumbnailPath: "/anime/Smoking%20Behind%20the%20Supermarket%20with%20You/S01E02/thumbnail.jpg",
                videoPath: "/anime/Smoking%20Behind%20the%20Supermarket%20with%20You/S01E02/video.mp4",
                subtitles: [
                    {
                        lang: "en",
                        label: "English (CR)",
                        path: "/anime/Smoking%20Behind%20the%20Supermarket%20with%20You/S01E02/en.vtt",
                        default: true
                    }
                ]
            },
            {
                number: 3,
                title: "Smoking Behind the Supermarket with You and More",
                duration: "23:50",
                quality: "720p",
                thumbnailPath: "/anime/Smoking%20Behind%20the%20Supermarket%20with%20You/S01E03/thumbnail.jpg",
                videoPath: "/anime/Smoking%20Behind%20the%20Supermarket%20with%20You/S01E03/video.mp4",
                subtitles: [
                    {
                        lang: "en",
                        label: "English (CR)",
                        path: "/anime/Smoking%20Behind%20the%20Supermarket%20with%20You/S01E03/en.vtt",
                        default: true
                    }
                ]
            },
            {
                number: 4,
                title: "Learning Behind the Supermarket with You",
                duration: "23:50",
                quality: "720p",
                thumbnailPath: "/anime/Smoking%20Behind%20the%20Supermarket%20with%20You/S01E04/thumbnail.jpg",
                videoPath: "/anime/Smoking%20Behind%20the%20Supermarket%20with%20You/S01E04/video.mp4",
                subtitles: [
                    {
                        lang: "en",
                        label: "English (CR)",
                        path: "/anime/Smoking%20Behind%20the%20Supermarket%20with%20You/S01E04/en.vtt",
                        default: true
                    }
                ]
            },
            {
                number: 5,
                title: "Hanging Behind the Supermarket with You",
                duration: "23:50",
                quality: "720p",
                thumbnailPath: "/anime/Smoking%20Behind%20the%20Supermarket%20with%20You/S01E05/thumbnail.jpg",
                videoPath: "/anime/Smoking%20Behind%20the%20Supermarket%20with%20You/S01E05/video.mp4",
                subtitles: [
                    {
                        lang: "en",
                        label: "English (CR)",
                        path: "/anime/Smoking%20Behind%20the%20Supermarket%20with%20You/S01E05/en.vtt",
                        default: true
                    }
                ]
            },
{
                number: 6,
                title: 'Lingering Scent Behind the Supermarket with You',
                duration: '23:50',
                quality: '1080p',
                thumbnailPath: '/anime/Smoking%20Behind%20the%20Supermarket%20with%20You/S01E06/thumbnail.jpg',
                videoPath: '/anime/Smoking%20Behind%20the%20Supermarket%20with%20You/S01E06/video.mp4',
                subtitles: [
                    {
                        lang: 'en',
                        label: 'English',
                        path: '/anime/Smoking%20Behind%20the%20Supermarket%20with%20You/S01E06/en.vtt',
                        default: true
                    },
                    {
                        lang: 'vi',
                        label: 'Vietnamese',
                        path: '/anime/Smoking%20Behind%20the%20Supermarket%20with%20You/S01E06/vi.vtt'
                    }
                ]
            }
        ]
    },
    {
        id: "bocchi-the-rock",
        title: "Bocchi the Rock!",
        year: 2026,
        genre: "Anime",
        posterPath: "/anime/Bocchi%20the%20Rock%21/series-thumbnail.jpg?v=426b4bbb5204",
        backdropPath: "/anime/Bocchi%20the%20Rock%21/series-thumbnail.jpg?v=426b4bbb5204",
        description: "Video, artwork and subtitles are served from the W41IT media origin.",
        episodes: [
            {
                number: 1,
                title: "Lonely Rolling Bocchi",
                duration: "23:44",
                quality: "720p",
                thumbnailPath: "/anime/Bocchi%20the%20Rock%21/S01E01/thumbnail.jpg",
                videoPath: "/anime/Bocchi%20the%20Rock%21/S01E01/video.mp4",
                subtitles: [
                    {
                        lang: "en",
                        label: "English ([DB+neoHEVC])",
                        path: "/anime/Bocchi%20the%20Rock%21/S01E01/en.vtt",
                        default: true
                    }
                ]
            },
            {
                number: 2,
                title: "See You Tomorrow",
                duration: "23:44",
                quality: "720p",
                thumbnailPath: "/anime/Bocchi%20the%20Rock%21/S01E02/thumbnail.jpg",
                videoPath: "/anime/Bocchi%20the%20Rock%21/S01E02/video.mp4",
                subtitles: [
                    {
                        lang: "en",
                        label: "English ([DB+neoHEVC])",
                        path: "/anime/Bocchi%20the%20Rock%21/S01E02/en.vtt",
                        default: true
                    }
                ]
            },
            {
                number: 3,
                title: "Be Right There",
                duration: "23:46",
                quality: "720p",
                thumbnailPath: "/anime/Bocchi%20the%20Rock%21/S01E03/thumbnail.jpg",
                videoPath: "/anime/Bocchi%20the%20Rock%21/S01E03/video.mp4",
                subtitles: [
                    {
                        lang: "en",
                        label: "English ([DB+neoHEVC])",
                        path: "/anime/Bocchi%20the%20Rock%21/S01E03/en.vtt",
                        default: true
                    }
                ]
            },
            {
                number: 4,
                title: "Jumping Girl(s)",
                duration: "23:44",
                quality: "720p",
                thumbnailPath: "/anime/Bocchi%20the%20Rock%21/S01E04/thumbnail.jpg",
                videoPath: "/anime/Bocchi%20the%20Rock%21/S01E04/video.mp4",
                subtitles: [
                    {
                        lang: "en",
                        label: "English ([DB+neoHEVC])",
                        path: "/anime/Bocchi%20the%20Rock%21/S01E04/en.vtt",
                        default: true
                    }
                ]
            },
            {
                number: 5,
                title: "Flightless Fish",
                duration: "23:46",
                quality: "720p",
                thumbnailPath: "/anime/Bocchi%20the%20Rock%21/S01E05/thumbnail.jpg",
                videoPath: "/anime/Bocchi%20the%20Rock%21/S01E05/video.mp4",
                subtitles: [
                    {
                        lang: "en",
                        label: "English ([DB+neoHEVC])",
                        path: "/anime/Bocchi%20the%20Rock%21/S01E05/en.vtt",
                        default: true
                    }
                ]
            },
            {
                number: 6,
                title: "Eight Views",
                duration: "23:46",
                quality: "720p",
                thumbnailPath: "/anime/Bocchi%20the%20Rock%21/S01E06/thumbnail.jpg",
                videoPath: "/anime/Bocchi%20the%20Rock%21/S01E06/video.mp4",
                subtitles: [
                    {
                        lang: "en",
                        label: "English ([DB+neoHEVC])",
                        path: "/anime/Bocchi%20the%20Rock%21/S01E06/en.vtt",
                        default: true
                    }
                ]
            },
            {
                number: 7,
                title: "To Your House",
                duration: "23:46",
                quality: "720p",
                thumbnailPath: "/anime/Bocchi%20the%20Rock%21/S01E07/thumbnail.jpg",
                videoPath: "/anime/Bocchi%20the%20Rock%21/S01E07/video.mp4",
                subtitles: [
                    {
                        lang: "en",
                        label: "English ([DB+neoHEVC])",
                        path: "/anime/Bocchi%20the%20Rock%21/S01E07/en.vtt",
                        default: true
                    }
                ]
            },
            {
                number: 8,
                title: "Bocchi the Rock",
                duration: "23:44",
                quality: "720p",
                thumbnailPath: "/anime/Bocchi%20the%20Rock%21/S01E08/thumbnail.jpg",
                videoPath: "/anime/Bocchi%20the%20Rock%21/S01E08/video.mp4",
                subtitles: [
                    {
                        lang: "en",
                        label: "English ([DB+neoHEVC])",
                        path: "/anime/Bocchi%20the%20Rock%21/S01E08/en.vtt",
                        default: true
                    }
                ]
            },
            {
                number: 9,
                title: "Enoshima Escarlator",
                duration: "23:46",
                quality: "720p",
                thumbnailPath: "/anime/Bocchi%20the%20Rock%21/S01E09/thumbnail.jpg",
                videoPath: "/anime/Bocchi%20the%20Rock%21/S01E09/video.mp4",
                subtitles: [
                    {
                        lang: "en",
                        label: "English ([DB+neoHEVC])",
                        path: "/anime/Bocchi%20the%20Rock%21/S01E09/en.vtt",
                        default: true
                    }
                ]
            },
            {
                number: 10,
                title: "After Dark",
                duration: "23:44",
                quality: "720p",
                thumbnailPath: "/anime/Bocchi%20the%20Rock%21/S01E10/thumbnail.jpg",
                videoPath: "/anime/Bocchi%20the%20Rock%21/S01E10/video.mp4",
                subtitles: [
                    {
                        lang: "en",
                        label: "English ([DB+neoHEVC])",
                        path: "/anime/Bocchi%20the%20Rock%21/S01E10/en.vtt",
                        default: true
                    }
                ]
            },
            {
                number: 11,
                title: "Duodecimal Sunset",
                duration: "23:46",
                quality: "720p",
                thumbnailPath: "/anime/Bocchi%20the%20Rock%21/S01E11/thumbnail.jpg",
                videoPath: "/anime/Bocchi%20the%20Rock%21/S01E11/video.mp4",
                subtitles: [
                    {
                        lang: "en",
                        label: "English ([DB+neoHEVC])",
                        path: "/anime/Bocchi%20the%20Rock%21/S01E11/en.vtt",
                        default: true
                    }
                ]
            },
            {
                number: 12,
                title: "Morning Light Falls on You",
                duration: "23:46",
                quality: "720p",
                thumbnailPath: "/anime/Bocchi%20the%20Rock%21/S01E12/thumbnail.jpg",
                videoPath: "/anime/Bocchi%20the%20Rock%21/S01E12/video.mp4",
                subtitles: [
                    {
                        lang: "en",
                        label: "English ([DB+neoHEVC])",
                        path: "/anime/Bocchi%20the%20Rock%21/S01E12/en.vtt",
                        default: true
                    }
                ]
            }
        ]
    },
    {
        id: "detective-conan-movie",
        title: "Detective Conan Movie",
        year: 2011,
        genre: "Anime",
        posterPath: "/anime/Detective%20Conan%20Movie/series-thumbnail.jpg?v=793a84255aba",
        backdropPath: "/anime/Detective%20Conan%20Movie/series-thumbnail.jpg?v=793a84255aba",
        description: "Video, artwork and subtitles are served from the W41IT media origin.",
        episodes: [
            {
                number: 1,
                title: "Detective Conan: Quarter of Silence",
                duration: "1:49:26",
                quality: "1080p",
                thumbnailPath: "/anime/Detective%20Conan%20Movie/S01E01/thumbnail.jpg",
                videoPath: "/anime/Detective%20Conan%20Movie/S01E01/video.mp4",
                subtitles: [
                    {
                        lang: "en",
                        label: "English (Ah-le-le)",
                        path: "/anime/Detective%20Conan%20Movie/S01E01/en.vtt",
                        default: true
                    }
                ]
            }
        ]
    }
];

// youtube-add owns this catalog. Channels are rendered as shelves and their
// videos reuse the same player, subtitle, queue, and autoplay machinery.
const YOUTUBE_CHANNELS = [
    {
        id: "kurzgesagt-in-a-nutshell",
        name: "Kurzgesagt – In a Nutshell",
        description: "Locally archived YouTube videos served from the W41IT media origin.",
        videos: [
            {
                id: "why-humanity-will-never-leave-the-solar-system",
                title: "Why Humanity Will Never Leave The Solar System",
                duration: "14:08",
                quality: "720p",
                thumbnailPath: "/youtube/kurzgesagt-in-a-nutshell/why-humanity-will-never-leave-the-solar-system/thumbnail.jpg",
                videoPath: "/youtube/kurzgesagt-in-a-nutshell/why-humanity-will-never-leave-the-solar-system/video.mp4",
                subtitles: []
            },
        {
            id: "how-are-memories-stored-inside-your-brain",
            title: "How Are Memories Stored Inside Your Brain？",
            duration: "13:56",
            quality: "720p",
            thumbnailPath: "/youtube/kurzgesagt-in-a-nutshell/how-are-memories-stored-inside-your-brain/thumbnail.jpg",
            videoPath: "/youtube/kurzgesagt-in-a-nutshell/how-are-memories-stored-inside-your-brain/video.mp4",
            subtitles: [
                { lang: "en", label: "English", path: "/youtube/kurzgesagt-in-a-nutshell/how-are-memories-stored-inside-your-brain/en.vtt", default: true },
                { lang: "en", label: "English", path: "/youtube/kurzgesagt-in-a-nutshell/how-are-memories-stored-inside-your-brain/en-2.vtt" }
            ]
        },
        {
            id: "we-found-a-loophole-to-survive-the-end-of-the-universe",
            title: "We Found a Loophole to Survive the End of the Universe",
            duration: "12:42",
            quality: "720p",
            thumbnailPath: "/youtube/kurzgesagt-in-a-nutshell/we-found-a-loophole-to-survive-the-end-of-the-universe/thumbnail.jpg",
            videoPath: "/youtube/kurzgesagt-in-a-nutshell/we-found-a-loophole-to-survive-the-end-of-the-universe/video.mp4",
            subtitles: [
                { lang: "en", label: "English", path: "/youtube/kurzgesagt-in-a-nutshell/we-found-a-loophole-to-survive-the-end-of-the-universe/en.vtt", default: true }
            ]
        },
        {
            id: "astronomy-is-in-crisis-and-it-s-incredibly-exciting",
            title: "Astronomy Is In Crisis And It's Incredibly Exciting",
            duration: "11:28",
            quality: "720p",
            thumbnailPath: "/youtube/kurzgesagt-in-a-nutshell/astronomy-is-in-crisis-and-it-s-incredibly-exciting/thumbnail.jpg",
            videoPath: "/youtube/kurzgesagt-in-a-nutshell/astronomy-is-in-crisis-and-it-s-incredibly-exciting/video.mp4",
            subtitles: [
                { lang: "en", label: "English", path: "/youtube/kurzgesagt-in-a-nutshell/astronomy-is-in-crisis-and-it-s-incredibly-exciting/en.vtt", default: true }
            ]
        },
        {
            id: "this-is-the-scariest-place-in-the-universe",
            title: "This Is the Scariest Place in The Universe",
            duration: "9:13",
            quality: "720p",
            thumbnailPath: "/youtube/kurzgesagt-in-a-nutshell/this-is-the-scariest-place-in-the-universe/thumbnail.jpg",
            videoPath: "/youtube/kurzgesagt-in-a-nutshell/this-is-the-scariest-place-in-the-universe/video.mp4",
            subtitles: [
                { lang: "en", label: "English", path: "/youtube/kurzgesagt-in-a-nutshell/this-is-the-scariest-place-in-the-universe/en.vtt", default: true }
            ]
        },
        {
            id: "alcohol-is-amazing",
            title: "Alcohol is AMAZING",
            duration: "14:12",
            quality: "720p",
            thumbnailPath: "/youtube/kurzgesagt-in-a-nutshell/alcohol-is-amazing/thumbnail.jpg",
            videoPath: "/youtube/kurzgesagt-in-a-nutshell/alcohol-is-amazing/video.mp4",
            subtitles: [
                { lang: "en", label: "English", path: "/youtube/kurzgesagt-in-a-nutshell/alcohol-is-amazing/en.vtt", default: true }
            ]
        },
        {
            id: "our-minds-are-weirder-than-you-think",
            title: "Our Minds Are Weirder than You Think",
            duration: "12:22",
            quality: "720p",
            thumbnailPath: "/youtube/kurzgesagt-in-a-nutshell/our-minds-are-weirder-than-you-think/thumbnail.jpg",
            videoPath: "/youtube/kurzgesagt-in-a-nutshell/our-minds-are-weirder-than-you-think/video.mp4",
            subtitles: [
                { lang: "en", label: "English", path: "/youtube/kurzgesagt-in-a-nutshell/our-minds-are-weirder-than-you-think/en.vtt", default: true }
            ]
        }
    ]
    },
    {
        id: "king-gnu-official-youtube-channel",
        name: "King Gnu official YouTube channel",
        description: "Locally archived YouTube videos served from the W41IT media origin.",
        videos: [
            {
                id: "king-gnu-aizo",
                title: "King Gnu - AIZO",
                duration: "3:58",
                quality: "720p",
                thumbnailPath: "/youtube/king-gnu-official-youtube-channel/king-gnu-aizo/thumbnail.jpg",
                videoPath: "/youtube/king-gnu-official-youtube-channel/king-gnu-aizo/video.mp4",
                subtitles: [
                    { lang: "en", label: "English", path: "/youtube/king-gnu-official-youtube-channel/king-gnu-aizo/en.vtt", default: true }
                ]
            },
            {
                id: "king-gnu-specialz",
                title: "King Gnu - SPECIALZ",
                duration: "4:01",
                quality: "720p",
                thumbnailPath: "/youtube/king-gnu-official-youtube-channel/king-gnu-specialz/thumbnail.jpg",
                videoPath: "/youtube/king-gnu-official-youtube-channel/king-gnu-specialz/video.mp4",
                subtitles: [
                    { lang: "en", label: "English", path: "/youtube/king-gnu-official-youtube-channel/king-gnu-specialz/en.vtt", default: true }
                ]
            },
            {
                id: "king-gnu",
                title: "King Gnu - 逆夢",
                duration: "5:19",
                quality: "694p",
                thumbnailPath: "/youtube/king-gnu-official-youtube-channel/king-gnu/thumbnail.jpg",
                videoPath: "/youtube/king-gnu-official-youtube-channel/king-gnu/video.mp4",
                subtitles: [
                    { lang: "en", label: "English", path: "/youtube/king-gnu-official-youtube-channel/king-gnu/en.vtt", default: true }
                ]
            },
            {
                id: "king-g-ichizu",
                title: "King Gnu - 一途",
                duration: "3:10",
                quality: "720p",
                thumbnailPath: "/youtube/king-gnu-official-youtube-channel/king-g-ichizu/thumbnail.jpg",
                videoPath: "/youtube/king-gnu-official-youtube-channel/king-g-ichizu/video.mp4",
                subtitles: [
                    { lang: "en", label: "English", path: "/youtube/king-gnu-official-youtube-channel/king-g-ichizu/en.vtt", default: true }
                ]
            },
            {
                id: "king-g-hakujitsu",
                title: "King Gnu - 白日",
                duration: "4:39",
                quality: "720p",
                thumbnailPath: "/youtube/king-gnu-official-youtube-channel/king-g-hakujitsu/thumbnail.jpg",
                videoPath: "/youtube/king-gnu-official-youtube-channel/king-g-hakujitsu/video.mp4",
                subtitles: [
                    { lang: "en", label: "English", path: "/youtube/king-gnu-official-youtube-channel/king-g-hakujitsu/en.vtt", default: true }
                ]
            },
            {
                id: "king-hikoutei",
                title: "King Gnu - 飛行艇",
                duration: "4:22",
                quality: "544p",
                thumbnailPath: "/youtube/king-gnu-official-youtube-channel/king-hikoutei/thumbnail.jpg",
                videoPath: "/youtube/king-gnu-official-youtube-channel/king-hikoutei/video.mp4",
                subtitles: [
                    { lang: "en", label: "English", path: "/youtube/king-gnu-official-youtube-channel/king-hikoutei/en.vtt", default: true }
                ]
            }
        ]
    }
];

const VIDEO_EPISODE_DURATIONS = ['23:41', '23:28', '23:17', '23:45', '23:36', '23:36', '23:51', '24:02', '23:44', '24:15', '23:38', '24:30'];

const VIDEO_AUTO_SWITCH_STORAGE_KEY = 'w41it-video-auto-switch-episode';

function readVideoAutoSwitchPreference() {
    try {
        const stored = window.localStorage.getItem(VIDEO_AUTO_SWITCH_STORAGE_KEY);
        return stored === null ? true : stored === 'true';
    } catch {
        return true;
    }
}

function saveVideoAutoSwitchPreference() {
    try {
        window.localStorage.setItem(
            VIDEO_AUTO_SWITCH_STORAGE_KEY,
            String(videoState.autoSwitchEpisode)
        );
    } catch {}
}

const videoState = {
    activeSeriesId: 'smoking-behind-supermarket',
    activeEpisode: 6,
    activeLibrary: 'anime',
    toastTimer: null,
    fallbackPlaying: false,
    currentSeconds: 0,
    subtitleLanguage: null,
    lastSubtitleLanguage: null,
    playbackRate: 1,
    loopEpisode: false,
    autoSwitchEpisode: readVideoAutoSwitchPreference()
};

function normalizeVideoSubtitles(subtitles) {
    if (Array.isArray(subtitles)) {
        return subtitles
            .map((track, index) => ({
                lang: track?.lang || `sub-${index + 1}`,
                label: track?.label || track?.lang || `Subtitle ${index + 1}`,
                src: resolveVideoMediaUrl(track?.path || track?.src || ''),
                default: Boolean(track?.default)
            }))
            .filter(track => Boolean(track.src));
    }

    return Object.entries(subtitles || {})
        .map(([lang, src]) => ({
            lang,
            label: lang === 'vi' ? 'Vietnamese' : lang === 'ja' ? 'Japanese' : 'English',
            src: resolveVideoMediaUrl(src),
            default: lang === 'en'
        }))
        .filter(track => Boolean(track.src));
}

function makeVideoEpisodes(series) {
    if (Array.isArray(series.episodes) && series.episodes.length > 0) {
        return series.episodes.map((episode, index) => ({
            id: episode.id || `${series.id}-e${episode.number ?? index + 1}`,
            number: Number(episode.number ?? index + 1),
            title: episode.title || `Episode ${episode.number ?? index + 1}`,
            duration: episode.duration || VIDEO_EPISODE_DURATIONS[index % VIDEO_EPISODE_DURATIONS.length],
            quality: episode.quality || '1080p',
            thumbnail: resolveVideoMediaUrl(episode.thumbnailPath || episode.thumbnail || ''),
            fileUrl: resolveVideoMediaUrl(episode.videoPath || episode.fileUrl || ''),
            subtitles: normalizeVideoSubtitles(episode.subtitles)
        }));
    }

    const titles = series.episodeTitles || [];
    return titles.map((title, index) => ({
        id: `${series.id}-e${index + 1}`,
        number: index + 1,
        title,
        duration: VIDEO_EPISODE_DURATIONS[index % VIDEO_EPISODE_DURATIONS.length],
        quality: '720p',
        thumbnail: getVideoSeriesPoster(series),
        fileUrl: '',
        subtitles: []
    }));
}

function youtubeChannelSeriesId(channelId) {
    return `youtube:${channelId}`;
}

function makeYoutubeChannelSeries(channel) {
    const videos = Array.isArray(channel.videos) ? channel.videos : [];
    const firstThumbnail = videos.find(video => video.thumbnailPath || video.thumbnail);

    return {
        id: youtubeChannelSeriesId(channel.id),
        sourceId: channel.id,
        contentType: 'youtube',
        title: channel.name || 'Unknown channel',
        updatedAt: channel.updatedAt || '',
        description: channel.description || 'Locally archived YouTube video served from the W41IT media origin.',
        posterPath: firstThumbnail?.thumbnailPath || firstThumbnail?.thumbnail || '',
        backdropPath: firstThumbnail?.thumbnailPath || firstThumbnail?.thumbnail || '',
        episodes: videos.map((video, index) => ({
            ...video,
            number: index + 1,
            title: video.title || `Video ${index + 1}`
        }))
    };
}

function sortVideoGroupsByLatestUpdate(groups) {
    return groups
        .map((group, catalogIndex) => ({
            group,
            catalogIndex,
            updatedAt: Date.parse(group?.updatedAt || '') || 0
        }))
        .sort((left, right) =>
            right.updatedAt - left.updatedAt || left.catalogIndex - right.catalogIndex
        )
        .map(entry => entry.group);
}

function getLatestVideoSeries() {
    return sortVideoGroupsByLatestUpdate(VIDEO_SERIES);
}

function getYoutubeChannelSeries() {
    return sortVideoGroupsByLatestUpdate(YOUTUBE_CHANNELS).map(makeYoutubeChannelSeries);
}

function getVideoSeries(seriesId) {
    const youtubeSeries = getYoutubeChannelSeries();
    return VIDEO_SERIES.find(series => series.id === seriesId)
        || youtubeSeries.find(series => series.id === seriesId)
        || VIDEO_SERIES[0]
        || youtubeSeries[0];
}

function isYoutubeSeries(series) {
    return series?.contentType === 'youtube';
}

function videoItemWord(series, { plural = false, capital = false } = {}) {
    let word = isYoutubeSeries(series) ? 'video' : 'episode';
    if (plural) word += 's';
    return capital ? word.charAt(0).toUpperCase() + word.slice(1) : word;
}

function getVideoEpisode(series, episodeNumber) {
    const episodes = makeVideoEpisodes(series);
    return episodes.find(episode => episode.number === Number(episodeNumber)) || episodes[0];
}

function parseDurationSeconds(duration) {
    const parts = String(duration || '0:00').split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return (parts[0] || 0) * 60 + (parts[1] || 0);
}

function formatVideoTime(seconds) {
    const safe = Math.max(0, Math.floor(Number(seconds) || 0));
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const secs = safe % 60;
    return hours > 0
        ? `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
        : `${minutes}:${String(secs).padStart(2, '0')}`;
}

function updateVideoRangeFill(input, value = input?.value) {
    if (!input) return;
    const min = Number(input.min || 0);
    const max = Number(input.max || 100);
    const numericValue = Number(value);
    const safeValue = Number.isFinite(numericValue) ? numericValue : min;
    const span = max - min;
    const percent = span > 0
        ? Math.max(0, Math.min(100, ((safeValue - min) / span) * 100))
        : 0;
    input.style.setProperty('--video-range-fill', `${percent}%`);
}

function updateVideoVolumeUi() {
    const video = document.getElementById('videoPlayer');
    const volume = document.getElementById('videoVolume');
    const button = document.getElementById('videoMuteBtn');
    if (!video) return;

    const volumePercent = Math.round(Math.max(0, Math.min(1, video.volume)) * 100);
    if (volume) {
        volume.value = String(volumePercent);
        // Keep the chosen volume value while muted, but visually empty the bar.
        updateVideoRangeFill(volume, video.muted ? 0 : volumePercent);
    }

    if (button) {
        const icon = video.muted || video.volume === 0
            ? 'fa-volume-mute'
            : video.volume < 0.5
                ? 'fa-volume-down'
                : 'fa-volume-up';
        button.innerHTML = `<i class="fas ${icon}"></i>`;
        button.setAttribute('aria-label', video.muted ? 'Unmute video' : 'Mute video');
        button.title = video.muted ? 'Unmute' : 'Mute';
    }
}

function switchMediaMode(mode) {
    const isVideo = mode === 'video';
    const mainPage = document.getElementById('mainPage');
    const audioMainView = document.getElementById('audioMainView');
    const videoMainView = document.getElementById('videoMainView');
    const navAudio = document.getElementById('navAllTracks');
    const navVideo = document.getElementById('navVideo');

    if (!mainPage || !audioMainView || !videoMainView) return;

    mainPage.classList.toggle('video-mode', isVideo);
    audioMainView.classList.toggle('hidden', isVideo);
    videoMainView.classList.toggle('hidden', !isVideo);
    navVideo?.classList.toggle('active', isVideo);
    navAudio?.classList.toggle('active', !isVideo);

    if (isVideo) {
        if (typeof audio !== 'undefined' && audio && !audio.paused) {
            audio.pause();
            if (typeof markPlaybackStopped === 'function') markPlaybackStopped();
        }
        renderVideoHome();
        showVideoHome();
    } else {
        const video = document.getElementById('videoPlayer');
        if (video && !video.paused) video.pause();
        videoState.fallbackPlaying = false;
        updateVideoPlaybackButtons();
        if (typeof showAllTracks === 'function') showAllTracks();
    }

    try {
        sessionStorage.setItem('w41it-media-mode', isVideo ? 'video' : 'audio');
    } catch {}

    if (window.innerWidth <= 900 && typeof closeSidebar === 'function') closeSidebar();
}

function renderVideoHome() {
    renderVideoLibraryPortals();
    renderVideoWhatsNew();
    renderVideoSeriesGrid();
    renderVideoYoutubeLibrary();
    syncVideoLibrarySelection();
}

function getVideoAnimePortalImages(limit = 5) {
    const latestSeries = getLatestVideoSeries();
    const seriesArtwork = latestSeries.map(series => getVideoSeriesPoster(series));
    const episodeArtwork = latestSeries.flatMap(series =>
        makeVideoEpisodes(series).map(episode => episode.thumbnail)
    );

    return [...new Set([...seriesArtwork, ...episodeArtwork].filter(Boolean))].slice(0, limit);
}

function renderVideoLibraryPortals() {
    const collage = document.getElementById('videoAnimeCollage');
    if (collage) {
        collage.replaceChildren();
        getVideoAnimePortalImages().forEach(src => {
            const image = document.createElement('img');
            image.src = src;
            image.alt = '';
            image.loading = 'eager';
            image.decoding = 'async';
            collage.appendChild(image);
        });
    }

    const seriesCount = VIDEO_SERIES.length;
    const episodeCount = VIDEO_SERIES.reduce(
        (total, series) => total + makeVideoEpisodes(series).length,
        0
    );
    const meta = document.getElementById('videoAnimePortalMeta');
    if (meta) {
        meta.textContent = seriesCount > 0
            ? `${seriesCount} series • ${episodeCount} episode${episodeCount === 1 ? '' : 's'}`
            : 'No anime added yet';
    }

    const youtubeCount = YOUTUBE_CHANNELS.reduce(
        (total, channel) => total + (Array.isArray(channel.videos) ? channel.videos.length : 0),
        0
    );
    const youtubeLibraryCount = document.getElementById('videoYoutubeLibraryCount');
    if (youtubeLibraryCount) {
        youtubeLibraryCount.textContent = `${youtubeCount} video${youtubeCount === 1 ? '' : 's'}`;
    }
}

function syncVideoLibrarySelection() {
    const showAnime = videoState.activeLibrary !== 'youtube';
    const animePortal = document.getElementById('videoAnimePortal');
    const youtubePortal = document.getElementById('videoYoutubePortal');
    const animeLibrary = document.getElementById('videoAnimeLibrary');
    const youtubeLibrary = document.getElementById('videoYoutubeLibrary');

    animePortal?.classList.toggle('active', showAnime);
    animePortal?.setAttribute('aria-pressed', showAnime ? 'true' : 'false');
    youtubePortal?.classList.toggle('active', !showAnime);
    youtubePortal?.setAttribute('aria-pressed', showAnime ? 'false' : 'true');
    animeLibrary?.classList.toggle('hidden', !showAnime);
    youtubeLibrary?.classList.toggle('hidden', showAnime);
}

function selectVideoLibrary(library) {
    if (library !== 'anime' && library !== 'youtube') return;
    videoState.activeLibrary = library;
    syncVideoLibrarySelection();
    scrollVideoLibraryIntoView();
}

function createVideoSeriesCard(series, { compact = false, isNew = false } = {}) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'video-series-card';
    card.dataset.seriesId = series.id;
    const episodes = makeVideoEpisodes(series);
    const firstEpisode = episodes[0];
    card.onclick = () => openVideoWatch(series.id, firstEpisode?.number);

    const art = document.createElement('span');
    art.className = 'video-series-art';

    const image = document.createElement('img');
    image.src = getVideoSeriesPoster(series);
    image.alt = '';
    image.loading = compact ? 'eager' : 'lazy';
    art.appendChild(image);

    if (isNew) {
        const badge = document.createElement('span');
        badge.className = 'video-new-badge';
        badge.textContent = 'NEW';
        art.appendChild(badge);
    }

    const title = document.createElement('span');
    title.className = 'video-series-title';
    title.textContent = series.title;

    const meta = document.createElement('span');
    meta.className = 'video-series-meta';
    meta.textContent = `${series.year} • ${episodes.length} episode${episodes.length === 1 ? '' : 's'}`;

    card.append(art, title, meta);
    return card;
}

function renderVideoWhatsNew() {
    const grid = document.getElementById('videoWhatsNewGrid');
    if (!grid) return;
    grid.replaceChildren();
    getLatestVideoSeries().slice(0, 7).forEach(series => {
        grid.appendChild(createVideoSeriesCard(series, { compact: true, isNew: true }));
    });
}

function renderVideoSeriesGrid() {
    const grid = document.getElementById('videoSeriesGrid');
    if (!grid) return;

    grid.replaceChildren();
    getLatestVideoSeries().forEach(series => grid.appendChild(createVideoSeriesCard(series)));

    if (VIDEO_SERIES.length === 0) {
        const empty = document.createElement('div');
        empty.style.cssText = 'grid-column:1/-1;padding:28px 4px;color:#8f9bad;font-size:.82rem;';
        empty.textContent = 'No anime series have been added yet.';
        grid.appendChild(empty);
    }
}

function createYoutubeVideoCard(series, episode) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'video-youtube-card';
    card.onclick = () => openVideoWatch(series.id, episode.number);

    const art = document.createElement('span');
    art.className = 'video-youtube-card-art';

    const image = document.createElement('img');
    image.src = episode.thumbnail;
    image.alt = '';
    image.loading = 'lazy';
    image.decoding = 'async';
    art.appendChild(image);

    const duration = document.createElement('span');
    duration.className = 'video-youtube-duration';
    duration.textContent = episode.duration;
    art.appendChild(duration);

    const title = document.createElement('strong');
    title.textContent = episode.title;

    const meta = document.createElement('span');
    meta.className = 'video-youtube-card-meta';
    meta.textContent = `${series.title} • ${episode.quality || '1080p'}`;

    card.append(art, title, meta);
    return card;
}

function renderVideoYoutubeLibrary() {
    const container = document.getElementById('videoYoutubeChannels');
    const library = document.getElementById('videoYoutubeLibrary');
    if (!container || !library) return;

    container.replaceChildren();
    const channels = getYoutubeChannelSeries();
    library.classList.toggle('is-empty', channels.length === 0);

    if (channels.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'video-youtube-empty';
        empty.innerHTML = `
            <i class="fab fa-youtube video-youtube-empty-icon" aria-hidden="true"></i>
            <h3>No local YouTube videos yet.</h3>
            <p>Run <code>youtube-add</code> on the VPS to process videos into <code>/srv/media/youtube/</code> and publish this catalog.</p>`;
        container.appendChild(empty);
        return;
    }

    channels.forEach(series => {
        const shelf = document.createElement('section');
        shelf.className = 'video-youtube-channel';

        const heading = document.createElement('div');
        heading.className = 'video-youtube-channel-heading';
        const title = document.createElement('h3');
        title.textContent = series.title;
        const count = document.createElement('span');
        const episodes = makeVideoEpisodes(series);
        count.textContent = `${episodes.length} video${episodes.length === 1 ? '' : 's'}`;
        heading.append(title, count);

        const grid = document.createElement('div');
        grid.className = 'video-youtube-grid';
        episodes.forEach(episode => grid.appendChild(createYoutubeVideoCard(series, episode)));

        shelf.append(heading, grid);
        container.appendChild(shelf);
    });
}

function showVideoHome() {
    const video = document.getElementById('videoPlayer');
    video?.pause();
    videoState.fallbackPlaying = false;
    updateVideoPlaybackButtons();
    closeVideoSettings();

    document.getElementById('videoHomeView')?.classList.remove('hidden');
    document.getElementById('videoWatchView')?.classList.add('hidden');
    const page = document.getElementById('videoHomeView');
    if (page) page.scrollTop = 0;
}

function openVideoWatch(seriesId, episodeNumber = 1) {
    const series = getVideoSeries(seriesId);
    if (!series) return;
    const episodes = makeVideoEpisodes(series);
    const requestedEpisode = Number(episodeNumber);
    const selectedEpisode = episodes.find(episode => episode.number === requestedEpisode) || episodes[0];
    if (!selectedEpisode) return;

    videoState.activeSeriesId = series.id;
    videoState.activeEpisode = selectedEpisode.number;
    videoState.activeLibrary = isYoutubeSeries(series) ? 'youtube' : 'anime';
    videoState.currentSeconds = 0;
    videoState.fallbackPlaying = false;

    document.getElementById('videoHomeView')?.classList.add('hidden');
    document.getElementById('videoWatchView')?.classList.remove('hidden');
    renderVideoWatchView();

    const page = document.getElementById('videoWatchView');
    if (page) page.scrollTop = 0;
}

function renderVideoWatchView() {
    const series = getVideoSeries(videoState.activeSeriesId);
    const episodes = makeVideoEpisodes(series);
    const episode = getVideoEpisode(series, videoState.activeEpisode);
    const video = document.getElementById('videoPlayer');

    if (video) {
        video.pause();
        video.removeAttribute('src');
        video.load();
        video.poster = getVideoSeriesBackdrop(series);

        if (episode.fileUrl) {
            video.src = episode.fileUrl;
            installVideoSubtitleTracks(video, episode);
            video.load();
        } else {
            removeVideoSubtitleTracks(video);
            rebuildVideoSubtitleSelector([]);
        }
    }

    const youtube = isYoutubeSeries(series);
    const itemWord = videoItemWord(series);
    document.getElementById('videoWatchView')?.classList.toggle('is-youtube', youtube);

    const breadcrumb = document.getElementById('videoBreadcrumb');
    if (breadcrumb) {
        breadcrumb.textContent = youtube
            ? `Video  /  YouTube  /  ${series.title}  /  ${episode.title}`
            : `Video  /  ${series.title}  /  S1 E${episode.number}`;
    }

    const seriesName = document.getElementById('videoWatchSeriesName');
    if (seriesName) seriesName.textContent = series.title;

    const title = document.getElementById('videoWatchEpisodeTitle');
    if (title) title.textContent = youtube
        ? episode.title
        : `S1 E${episode.number} · ${episode.title}`;

    const description = document.getElementById('videoWatchDescription');
    if (description) description.textContent = series.description;

    const meta = document.getElementById('videoWatchMeta');
    if (meta) {
        meta.innerHTML = youtube
            ? `<span>YouTube archive</span>
               <span>${escapeVideoHtml(series.title)}</span>
               <span>${episode.duration}</span>
               <span>${escapeVideoHtml(episode.quality || '720p')}</span>
               <span>${episode.fileUrl ? 'VPS stream' : 'No source'}</span>`
            : `<span>Season 1</span>
               <span>Episode ${episode.number}</span>
               <span>${episode.duration}</span>
               <span>${escapeVideoHtml(episode.quality || '720p')}</span>
               <span>${episode.fileUrl ? 'VPS stream' : 'No source'}</span>`;
    }

    const qualityBadge = document.querySelector('#videoStage .video-quality-badge');
    if (qualityBadge) qualityBadge.textContent = episode.quality || '720p';

    const panelTitle = document.getElementById('videoEpisodePanelTitle');
    if (panelTitle) panelTitle.textContent = series.title;
    const panelKind = document.getElementById('videoEpisodePanelKind');
    if (panelKind) panelKind.textContent = youtube ? 'YouTube channel' : 'Season 1';
    const poster = document.getElementById('videoEpisodeSeriesPoster');
    if (poster) {
        poster.src = getVideoSeriesPoster(series);
        poster.alt = `${series.title} ${youtube ? 'video thumbnail' : 'cover'}`;
    }
    const count = document.getElementById('videoEpisodeCount');
    if (count) count.textContent = `${episodes.length} ${videoItemWord(series, { plural: episodes.length !== 1, capital: true })}`;

    const autoSwitchLabel = document.getElementById('videoAutoSwitchLabel');
    if (autoSwitchLabel) autoSwitchLabel.textContent = `Auto-switch ${itemWord}`;
    const loopLabel = document.getElementById('videoLoopLabel');
    if (loopLabel) loopLabel.textContent = `Loop ${itemWord}`;

    renderVideoEpisodeList(series, episodes);
    resetVideoControlState(episode);
    closeVideoSettings();

    if (video) {
        video.playbackRate = videoState.playbackRate;
        video.loop = videoState.loopEpisode;
    }
    updateVideoSettingsUi();
}

function renderVideoEpisodeList(series, episodes = makeVideoEpisodes(series)) {
    const list = document.getElementById('videoEpisodeList');
    if (!list) return;
    list.replaceChildren();

    episodes.forEach(episode => {
        const row = document.createElement('button');
        row.type = 'button';
        const youtube = isYoutubeSeries(series);
        row.className = `video-episode-row${youtube ? ' is-youtube' : ''}${episode.number === videoState.activeEpisode ? ' active' : ''}`;
        row.dataset.episode = String(episode.number);
        row.onclick = () => openVideoWatch(series.id, episode.number);

        const stateIcon = episode.number < videoState.activeEpisode
            ? '<i class="fas fa-check-circle" title="Watched"></i>'
            : episode.number === videoState.activeEpisode
                ? '<i class="fas fa-play-circle"></i>'
                : '<i class="fas fa-ellipsis-v"></i>';

        row.innerHTML = `
            <img class="video-episode-thumb" src="${episode.thumbnail}" alt="">
            <span class="video-episode-number">${youtube ? '<i class="fab fa-youtube"></i>' : episode.number}</span>
            <span class="video-episode-copy">
                <strong>${escapeVideoHtml(episode.title)}</strong>
                <span>${episode.duration}</span>
            </span>
            <span class="video-episode-state">${stateIcon}</span>`;
        list.appendChild(row);
    });

    requestAnimationFrame(() => {
        list.querySelector('.video-episode-row.active')?.scrollIntoView({ block: 'nearest' });
    });
}

function resetVideoControlState(episode) {
    const seek = document.getElementById('videoSeekbar');
    if (seek) {
        seek.value = '0';
        updateVideoRangeFill(seek, 0);
    }
    videoState.currentSeconds = 0;
    videoState.fallbackPlaying = false;
    updateVideoTimeReadout(0, parseDurationSeconds(episode.duration));
    updateVideoPlaybackButtons();
    updateVideoVolumeUi();
}

function updateVideoPlaybackButtons() {
    const video = document.getElementById('videoPlayer');
    const actuallyPlaying = video && video.currentSrc && !video.paused && !video.ended;
    const playing = Boolean(actuallyPlaying || videoState.fallbackPlaying);
    const iconClass = playing ? 'fas fa-pause' : 'fas fa-play';

    const playButton = document.getElementById('videoPlayBtn');
    const stageButton = document.getElementById('videoStagePlayBtn');
    const qualityBadge = document.querySelector('#videoStage .video-quality-badge');
    if (playButton) playButton.innerHTML = `<i class="${iconClass}"></i>`;
    if (stageButton) {
        stageButton.innerHTML = `<i class="${iconClass}"></i>`;
        stageButton.setAttribute('aria-label', playing ? 'Pause video' : 'Play video');
        stageButton.classList.toggle('is-hidden', playing);
    }
    qualityBadge?.classList.toggle('is-hidden', playing);
}

async function toggleVideoPlayback() {
    const video = document.getElementById('videoPlayer');
    if (!video) return;

    if (!video.currentSrc) {
        videoState.fallbackPlaying = !videoState.fallbackPlaying;
        updateVideoPlaybackButtons();
        showVideoToast(
            videoState.fallbackPlaying
                ? 'Frontend demo playback. Add a media source to stream the real VPS video.'
                : 'Demo playback paused.'
        );
        return;
    }

    try {
        if (video.paused) await video.play();
        else video.pause();
    } catch (error) {
        console.warn('Video playback failed:', error);
        showVideoToast('The browser could not start this video source.');
    }
    updateVideoPlaybackButtons();
}

function videoPreviousEpisode() {
    const series = getVideoSeries(videoState.activeSeriesId);
    const episodes = makeVideoEpisodes(series);
    const currentIndex = episodes.findIndex(episode => episode.number === videoState.activeEpisode);
    if (currentIndex <= 0) {
        showVideoToast(`This is the first available ${videoItemWord(series)}.`);
        return;
    }
    openVideoWatch(series.id, episodes[currentIndex - 1].number);
}

function videoNextEpisode({ autoplay = false } = {}) {
    const series = getVideoSeries(videoState.activeSeriesId);
    const episodes = makeVideoEpisodes(series);
    const currentIndex = episodes.findIndex(episode => episode.number === videoState.activeEpisode);
    if (currentIndex < 0 || currentIndex >= episodes.length - 1) {
        showVideoToast(`This is the last available ${videoItemWord(series)}.`);
        return;
    }

    const nextEpisode = episodes[currentIndex + 1];
    openVideoWatch(series.id, nextEpisode.number);

    if (!autoplay) return;

    const video = document.getElementById('videoPlayer');
    if (nextEpisode.fileUrl && video) {
        const playAttempt = video.play();
        playAttempt?.catch?.(error => {
            console.warn('Automatic next-video playback failed:', error);
            showVideoToast(`The next ${videoItemWord(series)} is ready. Press play to continue.`);
        });
        return;
    }

    videoState.fallbackPlaying = true;
    updateVideoPlaybackButtons();
}

function toggleVideoMute() {
    const video = document.getElementById('videoPlayer');
    if (!video) return;
    video.muted = !video.muted;
    updateVideoVolumeUi();
}

function toggleVideoFullscreen() {
    const stage = document.getElementById('videoStage');
    if (!stage) return;
    if (document.fullscreenElement) {
        document.exitFullscreen?.();
        return;
    }
    stage.requestFullscreen?.().catch(() => showVideoToast('Fullscreen is unavailable in this browser.'));
}

function closeVideoSettings() {
    const menu = document.getElementById('videoSettingsMenu');
    const button = document.getElementById('videoSettingsBtn');
    if (!menu || !button) return;
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    button.setAttribute('aria-expanded', 'false');
}

function toggleVideoSettings(event) {
    event?.stopPropagation?.();
    const menu = document.getElementById('videoSettingsMenu');
    const button = document.getElementById('videoSettingsBtn');
    if (!menu || !button) return;

    const opening = !menu.classList.contains('is-open');
    closeVideoSettings();
    if (opening) {
        menu.classList.add('is-open');
        menu.setAttribute('aria-hidden', 'false');
        button.setAttribute('aria-expanded', 'true');
        updateVideoSettingsUi();
    }
}

function updateVideoSettingsUi() {
    const rate = Number(videoState.playbackRate) || 1;
    document.querySelectorAll('[data-video-rate]').forEach(button => {
        const buttonRate = Number(button.dataset.videoRate);
        button.classList.toggle('active', Math.abs(buttonRate - rate) < 0.001);
        button.setAttribute('aria-pressed', Math.abs(buttonRate - rate) < 0.001 ? 'true' : 'false');
    });

    const autoSwitchButton = document.getElementById('videoAutoSwitchToggle');
    if (autoSwitchButton) {
        autoSwitchButton.textContent = videoState.autoSwitchEpisode ? 'On' : 'Off';
        autoSwitchButton.classList.toggle('active', videoState.autoSwitchEpisode);
        autoSwitchButton.setAttribute('aria-pressed', videoState.autoSwitchEpisode ? 'true' : 'false');
    }

    const loopButton = document.getElementById('videoLoopToggle');
    if (loopButton) {
        loopButton.textContent = videoState.loopEpisode ? 'On' : 'Off';
        loopButton.classList.toggle('active', videoState.loopEpisode);
        loopButton.setAttribute('aria-pressed', videoState.loopEpisode ? 'true' : 'false');
    }
}

function setVideoPlaybackRate(rate) {
    const safeRate = Math.min(2, Math.max(0.5, Number(rate) || 1));
    videoState.playbackRate = safeRate;
    const video = document.getElementById('videoPlayer');
    if (video) video.playbackRate = safeRate;
    updateVideoSettingsUi();
}

function toggleVideoAutoSwitch() {
    videoState.autoSwitchEpisode = !videoState.autoSwitchEpisode;

    const video = document.getElementById('videoPlayer');
    if (videoState.autoSwitchEpisode && videoState.loopEpisode) {
        videoState.loopEpisode = false;
        if (video) video.loop = false;
    }

    saveVideoAutoSwitchPreference();
    updateVideoSettingsUi();
}

function toggleVideoLoop() {
    videoState.loopEpisode = !videoState.loopEpisode;

    if (videoState.loopEpisode && videoState.autoSwitchEpisode) {
        videoState.autoSwitchEpisode = false;
        saveVideoAutoSwitchPreference();
    }

    const video = document.getElementById('videoPlayer');
    if (video) video.loop = videoState.loopEpisode;
    updateVideoSettingsUi();
}

function updateVideoTimeReadout(current, duration) {
    const readout = document.getElementById('videoTimeReadout');
    if (readout) readout.textContent = `${formatVideoTime(current)} / ${formatVideoTime(duration)}`;
}

function seekVideoBy(offsetSeconds) {
    const video = document.getElementById('videoPlayer');
    const series = getVideoSeries(videoState.activeSeriesId);
    const episode = getVideoEpisode(series, videoState.activeEpisode);
    const duration = Number.isFinite(video?.duration) && video.duration > 0
        ? video.duration
        : parseDurationSeconds(episode.duration);
    const current = video?.currentSrc && Number.isFinite(video.currentTime)
        ? video.currentTime
        : videoState.currentSeconds;
    const target = Math.max(0, Math.min(duration, current + Number(offsetSeconds || 0)));

    if (video?.currentSrc && Number.isFinite(video.duration)) {
        video.currentTime = target;
    } else {
        videoState.currentSeconds = target;
    }

    const seekbar = document.getElementById('videoSeekbar');
    if (seekbar) {
        const value = duration > 0 ? Math.round((target / duration) * 1000) : 0;
        seekbar.value = String(value);
        updateVideoRangeFill(seekbar, value);
    }
    updateVideoTimeReadout(target, duration);
}

function removeVideoSubtitleTracks(video) {
    if (!video) return;

    Array.from(video.textTracks || []).forEach(track => {
        track.mode = 'disabled';
    });

    video.querySelectorAll('track').forEach(track => {
        track.default = false;
        track.remove();
    });
}

function chooseVideoSubtitleLanguage(subtitles = []) {
    const available = new Set(subtitles.map(track => track.lang));
    if (videoState.subtitleLanguage === 'off') return 'off';
    if (videoState.subtitleLanguage && available.has(videoState.subtitleLanguage)) {
        return videoState.subtitleLanguage;
    }

    const preferred = subtitles.find(track => track.default) || subtitles[0];
    return preferred?.lang || 'off';
}

function rebuildVideoSubtitleSelector(subtitles = []) {
    const select = document.getElementById('videoSubtitleSelect');
    if (!select) return;

    const selectedLanguage = chooseVideoSubtitleLanguage(subtitles);
    select.replaceChildren();

    subtitles.forEach(track => {
        const option = document.createElement('option');
        option.value = track.lang;
        option.textContent = track.label;
        select.appendChild(option);
    });

    const off = document.createElement('option');
    off.value = 'off';
    off.textContent = 'Off';
    select.appendChild(off);

    select.value = selectedLanguage;
    videoState.subtitleLanguage = selectedLanguage;
}

function installVideoSubtitleTracks(video, episode) {
    removeVideoSubtitleTracks(video);
    const subtitles = Array.isArray(episode.subtitles) ? episode.subtitles : [];
    rebuildVideoSubtitleSelector(subtitles);

    subtitles.forEach(subtitle => {
        if (!subtitle.src) return;

        const trackElement = document.createElement('track');
        trackElement.kind = 'subtitles';
        trackElement.srclang = subtitle.lang;
        trackElement.label = subtitle.label;
        trackElement.src = subtitle.src;

        // Do not use the HTML default flag. Some browsers can re-enable the
        // default text track asynchronously and leave two subtitle tracks showing.
        trackElement.default = false;
        trackElement.addEventListener('load', () => applySelectedSubtitle());
        video.appendChild(trackElement);

        if (trackElement.track) trackElement.track.mode = 'disabled';
    });

    requestAnimationFrame(() => applySelectedSubtitle());
}

function applySelectedSubtitle() {
    const video = document.getElementById('videoPlayer');
    const select = document.getElementById('videoSubtitleSelect');
    if (!video || !select) return;

    const selectedLanguage = select.value || 'off';
    videoState.subtitleLanguage = selectedLanguage;
    if (selectedLanguage !== 'off') videoState.lastSubtitleLanguage = selectedLanguage;
    const trackElements = Array.from(video.querySelectorAll('track'));

    // Control only the track elements that belong to the current episode.
    // Disable all of them first, then enable exactly one. This avoids stale
    // TextTrack entries or browser "default" races leaving two tracks visible.
    trackElements.forEach(trackElement => {
        if (trackElement.track) trackElement.track.mode = 'disabled';
    });

    if (selectedLanguage !== 'off') {
        const selectedTrackElement = trackElements.find(
            trackElement => trackElement.srclang === selectedLanguage
        );
        if (selectedTrackElement?.track) selectedTrackElement.track.mode = 'showing';
    }

    if (trackElements.length === 0) {
        const series = getVideoSeries(videoState.activeSeriesId);
        showVideoToast(`No subtitle tracks are available for this ${videoItemWord(series)}.`);
    }
}

function toggleVideoSubtitles() {
    const select = document.getElementById('videoSubtitleSelect');
    if (!select) return;

    const subtitleOptions = Array.from(select.options).filter(option => option.value !== 'off');
    if (subtitleOptions.length === 0) {
        const series = getVideoSeries(videoState.activeSeriesId);
        showVideoToast(`No subtitle tracks are available for this ${videoItemWord(series)}.`);
        return;
    }

    if (select.value === 'off') {
        const nextOption = subtitleOptions.find(
            option => option.value === videoState.lastSubtitleLanguage
        ) || subtitleOptions[0];
        select.value = nextOption.value;
        applySelectedSubtitle();
        showVideoToast(`Subtitles on: ${nextOption.textContent}.`);
        return;
    }

    videoState.lastSubtitleLanguage = select.value;
    select.value = 'off';
    applySelectedSubtitle();
    showVideoToast('Subtitles off.');
}

function scrollVideoLibraryIntoView() {
    const targetId = videoState.activeLibrary === 'youtube'
        ? 'videoYoutubeLibrary'
        : 'videoAnimeLibrary';
    requestAnimationFrame(() => {
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}

function showVideoToast(message) {
    const toast = document.getElementById('videoToast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(videoState.toastTimer);
    videoState.toastTimer = setTimeout(() => toast.classList.remove('visible'), 2600);
}

function escapeVideoHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function initializeVideo() {
    renderVideoHome();

    const subtitleSelect = document.getElementById('videoSubtitleSelect');
    subtitleSelect?.addEventListener('change', () => {
        applySelectedSubtitle();
        // Re-apply after the browser has processed the select/change event.
        requestAnimationFrame(() => applySelectedSubtitle());
    });

    const volume = document.getElementById('videoVolume');
    if (volume) {
        updateVideoRangeFill(volume, Number(volume.value));
        volume.addEventListener('input', event => {
            const video = document.getElementById('videoPlayer');
            const nextVolume = Math.max(0, Math.min(1, Number(event.target.value) / 100));
            updateVideoRangeFill(volume, Number(event.target.value));
            if (video) {
                video.volume = nextVolume;
                if (nextVolume > 0) video.muted = false;
                updateVideoVolumeUi();
            }
        });
    }

    const seek = document.getElementById('videoSeekbar');
    if (seek) {
        updateVideoRangeFill(seek, Number(seek.value));
        seek.addEventListener('input', event => {
            const video = document.getElementById('videoPlayer');
            const series = getVideoSeries(videoState.activeSeriesId);
            const episode = getVideoEpisode(series, videoState.activeEpisode);
            const duration = video?.duration && Number.isFinite(video.duration)
                ? video.duration
                : parseDurationSeconds(episode.duration);
            const sliderValue = Number(event.target.value);
            const target = duration * (sliderValue / 1000);

            updateVideoRangeFill(seek, sliderValue);
            if (video?.currentSrc && Number.isFinite(video.duration)) video.currentTime = target;
            else videoState.currentSeconds = target;

            updateVideoTimeReadout(target, duration);
        });
    }

    const video = document.getElementById('videoPlayer');
    if (video) {
        video.addEventListener('play', updateVideoPlaybackButtons);
        video.addEventListener('pause', updateVideoPlaybackButtons);
        video.addEventListener('click', event => {
            if (event.button !== 0) return;
            void toggleVideoPlayback();
        });
        video.addEventListener('loadedmetadata', () => {
            video.playbackRate = videoState.playbackRate;
            video.loop = videoState.loopEpisode;
            applySelectedSubtitle();
            const seekbar = document.getElementById('videoSeekbar');
            if (seekbar && Number.isFinite(video.duration) && video.duration > 0) {
                const value = Math.round((video.currentTime / video.duration) * 1000);
                seekbar.value = String(value);
                updateVideoRangeFill(seekbar, value);
            }
            updateVideoVolumeUi();
        });
        video.addEventListener('volumechange', updateVideoVolumeUi);
        video.addEventListener('ended', () => {
            updateVideoPlaybackButtons();
            if (!videoState.loopEpisode && videoState.autoSwitchEpisode) {
                videoNextEpisode({ autoplay: true });
            }
        });
        video.addEventListener('timeupdate', () => {
            if (!Number.isFinite(video.duration) || video.duration <= 0) return;
            const seekbar = document.getElementById('videoSeekbar');
            if (seekbar) {
                const value = Math.round((video.currentTime / video.duration) * 1000);
                seekbar.value = String(value);
                updateVideoRangeFill(seekbar, value);
            }
            updateVideoTimeReadout(video.currentTime, video.duration);
        });
    }

    document.addEventListener('click', event => {
        const settingsWrap = event.target?.closest?.('.video-settings-wrap');
        if (!settingsWrap) closeVideoSettings();
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') closeVideoSettings();
    });

    // Keep fallback controls functional for catalog entries that do not yet have a source.
    setInterval(() => {
        if (!videoState.fallbackPlaying) return;
        const currentSeries = getVideoSeries(videoState.activeSeriesId);
        const currentEpisode = getVideoEpisode(currentSeries, videoState.activeEpisode);
        const duration = parseDurationSeconds(currentEpisode.duration);
        videoState.currentSeconds = Math.min(duration, videoState.currentSeconds + 1);

        const seekbar = document.getElementById('videoSeekbar');
        if (seekbar) {
            const value = Math.round((videoState.currentSeconds / duration) * 1000);
            seekbar.value = String(value);
            updateVideoRangeFill(seekbar, value);
        }
        updateVideoTimeReadout(videoState.currentSeconds, duration);

        if (videoState.currentSeconds >= duration) {
            videoState.fallbackPlaying = false;
            updateVideoPlaybackButtons();
            if (!videoState.loopEpisode && videoState.autoSwitchEpisode) {
                videoNextEpisode({ autoplay: true });
            }
        }
    }, 1000);

    // Audio remains the default mode so existing behavior is unchanged on deploy.
    switchMediaMode('audio');
}

document.addEventListener('DOMContentLoaded', initializeVideo);
