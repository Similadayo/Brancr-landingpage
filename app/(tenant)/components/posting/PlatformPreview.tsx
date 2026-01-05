'use client';

import Image from 'next/image';

type PlatformPreviewProps = {
    platform: 'instagram' | 'facebook' | 'tiktok';
    caption: string;
    mediaUrls: string[];
    username?: string;
    userImage?: string;
};

export default function PlatformPreview({
    platform,
    caption,
    mediaUrls,
    username = "Your Brand",
    userImage = "/placeholder-user.jpg"
}: PlatformPreviewProps) {
    const isVideo = (url: string) => url.match(/\.(mp4|mov|webm)$/i);

    return (
        <div className={`preview-frame ${platform} mx-auto w-full max-w-[320px] overflow-hidden rounded-[2rem] border-8 border-gray-900 bg-white shadow-2xl`}>
            {/* Phone Status Bar Mockup */}
            <div className="flex justify-between px-6 pt-3 text-[10px] font-bold text-gray-800">
                <span>9:41</span>
                <div className="flex gap-1">
                    <span>📶</span>
                    <span>🔋</span>
                </div>
            </div>

            <div className="phone-mockup h-[600px] overflow-y-auto pb-4 scrollbar-hide">
                {/* Platform Header */}
                <div className="flex items-center gap-3 border-b border-gray-100 p-3">
                    <div className="h-8 w-8 overflow-hidden rounded-full bg-gray-200">
                        {/* Using a generic avatar if no image provided */}
                        {userImage && !userImage.includes('placeholder') ? (
                            <img src={userImage} alt={username} className="h-full w-full object-cover" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-indigo-100 text-indigo-600 font-bold">
                                {username[0]}
                            </div>
                        )}
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-semibold text-gray-900">{username}</p>
                        {platform === 'facebook' && <p className="text-[10px] text-gray-500">Just now • 🌍</p>}
                        {platform === 'instagram' && <p className="text-[10px] text-gray-500">Original Audio</p>}
                    </div>
                    <div className="text-gray-400">•••</div>
                </div>

                {/* Media Content */}
                <div className="relative aspect-[4/5] w-full bg-black">
                    {mediaUrls.length > 0 ? (
                        mediaUrls.map((url, i) => (
                            <div key={i} className={`absolute inset-0 flex items-center justify-center ${i === 0 ? 'block' : 'hidden'}`}>
                                {isVideo(url) ? (
                                    <video src={url} className="max-h-full max-w-full object-contain" controls />
                                ) : (
                                    <img src={url} alt={`Slide ${i + 1}`} className="max-h-full max-w-full object-contain" />
                                )}
                                {mediaUrls.length > 1 && (
                                    <div className="absolute top-2 right-2 rounded-full bg-black/50 px-2 py-1 text-[10px] text-white">
                                        {i + 1}/{mediaUrls.length}
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-50 text-gray-400">
                            <div className="text-center">
                                <span className="text-2xl">📷</span>
                                <p className="mt-2 text-xs">No media selected</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between p-3">
                    <div className="flex gap-4 text-xl">
                        {platform === 'instagram' && (
                            <>
                                <button>❤️</button>
                                <button>💬</button>
                                <button>🚀</button>
                            </>
                        )}
                        {platform === 'facebook' && (
                            <>
                                <button className="flex items-center gap-1 text-sm text-gray-600">👍 Like</button>
                                <button className="flex items-center gap-1 text-sm text-gray-600">💬 Comment</button>
                                <button className="flex items-center gap-1 text-sm text-gray-600">↗️ Share</button>
                            </>
                        )}
                        {platform === 'tiktok' && (
                            <div className="flex w-full justify-between px-4 text-2xl">
                                <button>❤️</button>
                                <button>💬</button>
                                <button>↪️</button>
                            </div>
                        )}
                    </div>
                    {platform === 'instagram' && <button>🔖</button>}
                </div>

                {/* Caption */}
                <div className="px-3 pb-3">
                    {platform === 'instagram' && (
                        <p className="mb-1 text-xs font-semibold">{Math.floor(Math.random() * 1000)} likes</p>
                    )}
                    <div className="text-xs text-gray-800">
                        <span className="font-semibold mr-2">{username}</span>
                        {caption ? (
                            caption.split(/(#\w+)/g).map((part, i) =>
                                part.startsWith('#') ? (
                                    <span key={i} className="text-blue-600">{part}</span>
                                ) : (
                                    <span key={i}>{part}</span>
                                )
                            )
                        ) : (
                            <span className="text-gray-400 italic">Write a caption...</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
