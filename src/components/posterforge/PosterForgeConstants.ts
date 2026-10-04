// PosterForge AI — Constants, Style Presets, and Template Library
import {
  PosterTypeItem,
  PosterStyleItem,
  PosterCompositionItem,
  PosterLightingItem,
  PosterColorGradeId,
  PosterMoodId,
  AspectRatioPreset,
  Typography3DEffect,
  PosterProject,
  PosterSmartOverlay,
} from './PosterForgeTypes';

// ── 1. 25 POSTER TYPES ──
export const POSTER_TYPES: PosterTypeItem[] = [
  { id: 'anime', labelKhmer: 'Anime ភាពយន្តតុក្កតា', labelEn: 'Anime Poster', icon: '🎨', defaultAspectRatio: '2:3', promptKeyword: 'masterpiece anime theatrical poster, vibrant cel-shaded anime aesthetic, high-end animation studio style, Makoto Shinkai and Ufotable cinematic anime lighting', category: 'fiction' },
  { id: 'donghua', labelKhmer: 'Donghua គំនូរជីវចលចិន 3D', labelEn: 'Donghua 3D Poster', icon: '✨', defaultAspectRatio: '2:3', promptKeyword: 'Chinese 3D Donghua cinematic animation movie poster, Sparkly Key and Tencent video quality, ultra-detailed CGI character modeling, silk physics, ornate Taoist accessories', category: 'fiction' },
  { id: 'xianxia', labelKhmer: 'Xianxia ទេវកថា & អាទិទេព', labelEn: 'Xianxia Poster', icon: '🐉', defaultAspectRatio: '2:3', promptKeyword: 'Immortal Xianxia fantasy movie poster, celestial floating mountains, golden swirling cloud dragons, Taoist immortal robe with gold embroidery, spiritual energy aura, heavenly palace in clouds', category: 'fiction' },
  { id: 'wuxia', labelKhmer: 'Wuxia យុទ្ធសិល្ប៍បុរាណ', labelEn: 'Wuxia Poster', icon: '⚔️', defaultAspectRatio: '2:3', promptKeyword: 'Wuxia martial arts epic poster, flying swordsmen, bamboo forest battle, flowing ancient hanfu garments, dynamic sword stance, cinematic wind effects', category: 'fiction' },
  { id: 'fantasy', labelKhmer: 'Epic Fantasy វេទមន្ត', labelEn: 'Epic Fantasy Poster', icon: '🔮', defaultAspectRatio: '2:3', promptKeyword: 'High epic fantasy theatrical poster, glowing magical runes, mythical creatures, castle in the clouds, ethereal atmosphere, volumetric spellcasting light', category: 'fiction' },
  { id: 'action', labelKhmer: 'Action កំពូលសកម្មភាព', labelEn: 'Action Poster', icon: '💥', defaultAspectRatio: '2:3', promptKeyword: 'Explosive high-octane Hollywood action blockbuster poster, debris and sparks, cinematic smoke, intense dynamic motion, IMAX poster composition', category: 'cinema' },
  { id: 'movie', labelKhmer: 'Movie ភាពយន្តចល័តកុន', labelEn: 'Theatrical Movie Poster', icon: '🎬', defaultAspectRatio: '2:3', promptKeyword: 'A24 and Warner Bros theatrical feature film key art poster, 35mm film grain, anamorphic lens flare, masterclass art direction, dramatic award-winning cinema framing', category: 'cinema' },
  { id: 'tv_series', labelKhmer: 'TV Series រឿងភាគភាគ', labelEn: 'TV Series Poster', icon: '📺', defaultAspectRatio: '2:3', promptKeyword: 'Premium streaming series key art, HBO Netflix quality character showcase, atmospheric depth, episodic storytelling visual hierarchy', category: 'cinema' },
  { id: 'game', labelKhmer: 'Game ហ្គេម 3D AAA', labelEn: 'AAA Game Poster', icon: '🎮', defaultAspectRatio: '16:9', promptKeyword: 'Unreal Engine 5 AAA game cover art, hyper-detailed character gear, ray-traced reflections, dynamic combat pose, sci-fi and fantasy game key visual', category: 'commercial' },
  { id: 'character', labelKhmer: 'Character តួអង្គទោល', labelEn: 'Character Poster', icon: '👤', defaultAspectRatio: '2:3', promptKeyword: 'Iconic character reveal poster, intimate high-fashion cinematic portrait, micro-textured skin and fabric, striking character personality lighting', category: 'fiction' },
  { id: 'romance', labelKhmer: 'Romance ស្នេហាបុរាណ/ទំនើប', labelEn: 'Romance Poster', icon: '🌸', defaultAspectRatio: '2:3', promptKeyword: 'Heartwarming romantic cinematic poster, soft golden hour sunlight, cherry blossoms or autumn leaves floating, tender emotional glance, dreamlike bokeh', category: 'fiction' },
  { id: 'horror', labelKhmer: 'Horror ព្រឺព្រួចភ័យរន្ធត់', labelEn: 'Dark Horror Poster', icon: '👻', defaultAspectRatio: '2:3', promptKeyword: 'Spine-chilling psychological horror movie poster, deep shadows, mist-shrouded silhouette, haunting atmospheric tension, eerie monochromatic grading', category: 'cinema' },
  { id: 'dark_fantasy', labelKhmer: 'Dark Fantasy វេទមន្តងងឹត', labelEn: 'Dark Fantasy Poster', icon: '🖤', defaultAspectRatio: '2:3', promptKeyword: 'Gothic dark fantasy key art, sinister demon lords, obsidian armor, crimson magic runes, ominous blood moon, Elden Ring dark aesthetics', category: 'fiction' },
  { id: 'cultivation', labelKhmer: 'Cultivation ហាត់សមណៈធម៌', labelEn: 'Cultivation Poster', icon: '🧘', defaultAspectRatio: '2:3', promptKeyword: 'Immortal cultivation breakthrough poster, swirling golden meridians, lotus formation, spiritual tribulation lightning, transcendent enlightenment glow', category: 'fiction' },
  { id: 'martial_arts', labelKhmer: 'Martial Arts ក្បាច់គុន', labelEn: 'Martial Arts Poster', icon: '🥋', defaultAspectRatio: '2:3', promptKeyword: 'Authentic martial arts tournament poster, dynamic flying kick or punch, traditional kung fu robes, paper-ink splash energy trails', category: 'fiction' },
  { id: 'music', labelKhmer: 'Music តន្ត្រី & MV', labelEn: 'Music / Album Poster', icon: '🎵', defaultAspectRatio: '1:1', promptKeyword: 'Modern music album vinyl cover and tour poster, aesthetic neon gradient, retro synthwave or emotional acoustics, high-fashion musician portrait', category: 'commercial' },
  { id: 'event', labelKhmer: 'Event មហោស្រព & កម្មវិធី', labelEn: 'Grand Event Poster', icon: '🎪', defaultAspectRatio: '4:5', promptKeyword: 'Prestigious global gala and festival poster, laser beams, confetti burst, luxury stage lighting, commercial event branding layout', category: 'commercial' },
  { id: 'product_ad', labelKhmer: 'Product ពាណិជ្ជកម្មផលិតផល', labelEn: 'Product Advertisement', icon: '💎', defaultAspectRatio: '1:1', promptKeyword: 'Commercial luxury product advertisement, macro studio lighting, pristine water droplets or crystal reflections, minimalist modern commercial layout', category: 'commercial' },
  { id: 'website_promo', labelKhmer: 'Website Promo ផ្សព្វផ្សាយវេបសាយ', labelEn: 'Website Promo Banner', icon: '🌐', defaultAspectRatio: '16:9', promptKeyword: 'Clean futuristic tech website promotional hero visual, 3D floating glass elements, sleek gradients, modern UI showcase', category: 'commercial' },
  { id: 'facebook_promo', labelKhmer: 'Facebook Post ផុសទំព័រហ្វេសប៊ុក', labelEn: 'Facebook Promotion', icon: '📘', defaultAspectRatio: '1:1', promptKeyword: 'Eye-catching Facebook viral feed poster, high contrast, vibrant focal point, optimized for high click-through rate in social feeds', category: 'social' },
  { id: 'tiktok_cover', labelKhmer: 'TikTok Cover គម្របវីដេអូទិកតុក', labelEn: 'TikTok 9:16 Cover', icon: '📱', defaultAspectRatio: '9:16', promptKeyword: 'Vertical 9:16 full-screen TikTok cover visual, top and bottom negative space for captions, vibrant central character burst, trending mobile aesthetics', category: 'social' },
  { id: 'youtube_thumbnail', labelKhmer: 'YouTube Thumbnail រូបតំណាងយូធូប', labelEn: 'YouTube 16:9 Thumbnail', icon: '🔴', defaultAspectRatio: '16:9', promptKeyword: 'High-CTR YouTube video thumbnail poster, expressive character face, high-contrast rim lighting, bold focal elements, cinematic 16:9 widescreen', category: 'social' },
  { id: 'instagram_post', labelKhmer: 'Instagram 4:5 Portrait', labelEn: 'Instagram 4:5 Poster', icon: '📸', defaultAspectRatio: '4:5', promptKeyword: 'Aesthetic high-fashion Instagram 4:5 portrait, editorial magazine cover quality, refined color harmony, trending art director composition', category: 'social' },
  { id: 'banner', labelKhmer: 'Banner 21:9 បដាធំទូលាយ', labelEn: 'Ultrawide 21:9 Banner', icon: '🚩', defaultAspectRatio: '21:9', promptKeyword: 'Panoramic 21:9 ultrawide cinematic banner, vast sweeping landscape, epic scale world-building, multiple environmental story layers', category: 'social' },
  { id: 'vip_poster', labelKhmer: 'VIP Golden Poster លំដាប់សេដ្ឋី', labelEn: 'Premium VIP Poster', icon: '👑', defaultAspectRatio: '2:3', promptKeyword: 'Opulent gold-leaf and black velvet VIP luxury poster, filigree embroidery, royal insignia, diamond sparkles, utmost prestige and exclusivity', category: 'commercial' },
];

// ── 2. 30+ VISUAL STYLE PRESETS ──
export const VISUAL_STYLES: PosterStyleItem[] = [
  { id: 'cinematic', labelKhmer: 'ភាពយន្តហូលីវូដ', labelEn: 'Cinematic Movie', gradient: 'from-amber-600 via-neutral-900 to-black', promptExpansion: '35mm anamorphic theatrical movie still, subtle film grain, cinematic depth of field, dramatic color contrast, master photography', lightingSuggestion: 'volumetric' },
  { id: 'epic_fantasy', labelKhmer: 'Epic Fantasy វេទមន្តមហិមា', labelEn: 'Epic Fantasy', gradient: 'from-purple-700 via-indigo-900 to-blue-950', promptExpansion: 'high fantasy concept art by greg rutkowski and frank frazetta, monumental scale, glowing magical runes, billowing storm clouds', lightingSuggestion: 'god_ray' },
  { id: 'xianxia_heaven', labelKhmer: 'ឋានសួគ៌ Xianxia', labelEn: 'Xianxia Heaven', gradient: 'from-amber-300 via-sky-600 to-indigo-900', promptExpansion: 'ethereal Xianxia celestial realm, floating jade palaces, golden clouds, shimmering spirit essence, white and gold flowing robes', lightingSuggestion: 'heavenly_light' },
  { id: 'ancient_china', labelKhmer: 'រាជវង្សចិនបុរាណ', labelEn: 'Ancient China', gradient: 'from-red-800 via-amber-900 to-stone-900', promptExpansion: 'grand Chinese imperial dynasty aesthetics, red forbidden city architecture, silk tapestries, golden dragons, historical majesty', lightingSuggestion: 'sunset' },
  { id: 'chinese_ink', labelKhmer: 'គំនូរទឹកថ្នាំបុរាណ (Ink Wash)', labelEn: 'Chinese Ink Painting', gradient: 'from-zinc-400 via-zinc-800 to-black', promptExpansion: 'traditional Shan Shui sumi-e ink wash painting with modern 3D splash effects, calligraphy texture, misty mountain peaks, minimalist elegance', lightingSuggestion: 'moon_light' },
  { id: 'golden_immortal', labelKhmer: 'អាទិទេពមាស', labelEn: 'Golden Immortal', gradient: 'from-yellow-400 via-amber-600 to-amber-950', promptExpansion: 'transcendent golden immortal deity, luminous golden solar halo, pure golden spiritual aura, floating divine scripture rings', lightingSuggestion: 'golden_light' },
  { id: 'dark_cultivation', labelKhmer: 'មន្តអាគមងងឹត', labelEn: 'Dark Cultivation', gradient: 'from-purple-900 via-slate-950 to-red-950', promptExpansion: 'forbidden demonic cultivation technique, shadowy tendrils of black Qi, glowing violet eyes, demonic blood seal, dark palace', lightingSuggestion: 'purple_energy' },
  { id: 'heavenly_realm', labelKhmer: 'ឋានសួគ៌ភពព្រះ', labelEn: 'Heavenly Realm', gradient: 'from-sky-300 via-indigo-700 to-purple-950', promptExpansion: 'dazzling heavenly realm, crystal waterfalls cascading into the void, rainbow clouds, divine cherubim energy, pure celestial light', lightingSuggestion: 'white_divine' },
  { id: 'demon_realm', labelKhmer: 'ឋានបិសាច', labelEn: 'Demon Realm', gradient: 'from-red-600 via-purple-950 to-black', promptExpansion: 'volcanic abyss demon realm, magma fissures, obsidian spires, hellfire glowing aura, colossal demonic horned silhouette', lightingSuggestion: 'red_fire' },
  { id: 'celestial_palace', labelKhmer: 'រាជវាំងទេវតាពពក', labelEn: 'Celestial Palace', gradient: 'from-amber-200 via-cyan-800 to-indigo-950', promptExpansion: 'floating Taoist celestial palace pavilions suspended among sea of swirling clouds, golden rooftops, illuminated lanterns, mystical tranquility', lightingSuggestion: 'sunrise' },
  { id: 'dragon_fantasy', labelKhmer: 'នាគរាជមហិទ្ធិឫទ្ធិ', labelEn: 'Dragon Fantasy', gradient: 'from-emerald-600 via-teal-900 to-amber-950', promptExpansion: 'immense ancient Eastern dragon coiling across the entire sky, shimmering scales, glowing whisker particles, lightning thunderclouds', lightingSuggestion: 'blue_lightning' },
  { id: 'lightning_god', labelKhmer: 'ព្រះរន្ទះ & ផ្គរលាន់', labelEn: 'Lightning God', gradient: 'from-cyan-400 via-blue-700 to-indigo-950', promptExpansion: 'divine lightning sovereign summoning thunderbolts, crackling electric plasma arcs, storm vortex, glowing cyan eyes, energized aura', lightingSuggestion: 'blue_lightning' },
  { id: 'ice_fantasy', labelKhmer: 'វេទមន្តទឹកកក', labelEn: 'Ice Fantasy', gradient: 'from-cyan-200 via-blue-800 to-slate-950', promptExpansion: 'glacial frost monarch, crystalline ice shards, swirling blizzard, frosted silver hair, transparent ice armor, diamond frost reflections', lightingSuggestion: 'moon_light' },
  { id: 'fire_god', labelKhmer: 'ព្រះអគ្គី & ភ្លើងបរិសុទ្ធ', labelEn: 'Fire God', gradient: 'from-yellow-400 via-orange-600 to-red-950', promptExpansion: 'blazing phoenix fire sovereign, molten flame wings, swirling fire tornado, glowing embers, incandescent heat haze', lightingSuggestion: 'red_fire' },
  { id: 'space_fantasy', labelKhmer: 'លំហអាកាស & កាឡាក់ស៊ី', labelEn: 'Space Fantasy', gradient: 'from-pink-500 via-purple-900 to-black', promptExpansion: 'cosmic celestial void, nebula swirling with stardust, glowing planetary rings, supernova burst, deep space mysticism', lightingSuggestion: 'purple_energy' },
  { id: 'cyberpunk', labelKhmer: 'Cyberpunk អនាគត', labelEn: 'Cyberpunk Sci-Fi', gradient: 'from-fuchsia-600 via-cyan-600 to-black', promptExpansion: 'rain-slicked futuristic cyberpunk metropolis, towering holographic advertisements, neon reflections in puddles, chrome cybernetic enhancements', lightingSuggestion: 'neon_light' },
  { id: 'neon', labelKhmer: 'ពន្លឺ Neon ទំនើប', labelEn: 'Vibrant Neon', gradient: 'from-pink-500 via-cyan-500 to-purple-900', promptExpansion: 'high-contrast electric neon aesthetics, dual-tone magenta and cyan rim lights, laser line accents, stylish contemporary pop glow', lightingSuggestion: 'neon_light' },
  { id: 'dark_horror', labelKhmer: 'ភ័យរន្ធត់ខ្មៅងងឹត', labelEn: 'Gothic Horror', gradient: 'from-zinc-700 via-zinc-900 to-black', promptExpansion: 'sinister gothic chiaroscuro, heavy cinematic shadows, decaying architecture, fog, chilling psychological suspense', lightingSuggestion: 'dark_shadow' },
  { id: 'royal_luxury', labelKhmer: 'រាជវង្សអភិជន', labelEn: 'Royal Luxury', gradient: 'from-amber-400 via-stone-800 to-amber-950', promptExpansion: 'opulent royal palace hall, crystal chandeliers, velvet and gold filigree, marble pillars, utmost elegance and aristocracy', lightingSuggestion: 'golden_light' },
  { id: 'minimal_luxury', labelKhmer: 'Minimalist ថ្លៃថ្នូរ', labelEn: 'Minimal Luxury', gradient: 'from-stone-300 via-stone-600 to-stone-900', promptExpansion: 'clean modern Scandinavian and Japanese architectural minimalism, premium negative space, soft ambient shadows, haute couture essence', lightingSuggestion: 'volumetric' },
  { id: '3d_typography', labelKhmer: '3D Blockbuster Typography', labelEn: '3D Typography Art', gradient: 'from-amber-500 via-indigo-800 to-black', promptExpansion: 'heavy metal 3D extruded movie logo sculpture, cinematic metallic bevels, backlit studio lighting, blockbuster franchise poster styling', lightingSuggestion: 'rim_light' },
  { id: 'realistic_movie', labelKhmer: 'កុនភាពយន្តពិត 8K', labelEn: 'Ultra Realistic Film', gradient: 'from-neutral-700 via-neutral-900 to-black', promptExpansion: 'photorealistic 8k cinema capture, ARRI Alexa LF camera, Zeiss master prime lens, natural skin pores, lifelike dynamic lighting', lightingSuggestion: 'volumetric' },
  { id: 'anime', labelKhmer: 'Anime ស្ទីលបែបជប៉ុន', labelEn: 'Japanese Anime', gradient: 'from-sky-400 via-indigo-600 to-purple-900', promptExpansion: 'award-winning theatrical anime key art, detailed hair strands, emotive anime eyes, hand-painted scenic backgrounds, Kyoto Animation quality', lightingSuggestion: 'sunset' },
  { id: 'donghua', labelKhmer: 'Donghua 3D ស្ទូឌីយោចិន', labelEn: 'Tencent Donghua 3D', gradient: 'from-cyan-400 via-indigo-800 to-slate-900', promptExpansion: 'photorealistic 3D Donghua render, subsurface scattering on skin, intricate silk brocade, floating weapons, Tencent and Bilibili donghua flagship standard', lightingSuggestion: 'heavenly_light' },
  { id: 'manga', labelKhmer: 'Manga សខ្មៅកម្រិតខ្ពស់', labelEn: 'Manga / Manhwa', gradient: 'from-zinc-200 via-zinc-600 to-black', promptExpansion: 'meticulous manga cross-hatching, screentone texture, high-drama black and white ink contrast with vivid color accents', lightingSuggestion: 'rim_light' },
  { id: 'manhua', labelKhmer: 'Manhua ពណ៌ចម្រុះ', labelEn: 'Colored Manhua', gradient: 'from-emerald-400 via-teal-700 to-indigo-950', promptExpansion: 'vibrant full-color webtoon and manhua art style, glowing magic circles, dynamic action speed lines, polished digital painting', lightingSuggestion: 'blue_lightning' },
  { id: 'comic', labelKhmer: 'Western Comic Book', labelEn: 'Comic Book Style', gradient: 'from-red-500 via-yellow-500 to-blue-900', promptExpansion: 'dynamic Marvel and DC comic book cover art, bold lineart, Ben-Day dots, dramatic heroic low angle perspective', lightingSuggestion: 'rim_light' },
  { id: 'traditional_chinese', labelKhmer: 'គំនូរប្រពៃណីចិន', labelEn: 'Traditional Chinese Art', gradient: 'from-amber-200 via-red-900 to-stone-900', promptExpansion: 'Dunhuang flying apsaras fresco art, traditional mineral pigments on aged silk paper, auspicious cloud motifs, ancient Chinese cultural heritage', lightingSuggestion: 'golden_light' },
  { id: 'modern_chinese', labelKhmer: 'ស្ទីលចិនសហសម័យ', labelEn: 'Modern Chinese Guochao', gradient: 'from-rose-500 via-purple-700 to-cyan-800', promptExpansion: 'trendy Guochao modern Chinese fashion fusion, neon calligraphy, cyber hanfu street fashion, youthful creative energy', lightingSuggestion: 'neon_light' },
  { id: 'fantasy_illustration', labelKhmer: 'គំនូរវេទមន្ត Magic Art', labelEn: 'Fantasy Illustration', gradient: 'from-indigo-400 via-purple-600 to-slate-950', promptExpansion: 'Magic The Gathering card illustration quality, deep narrative worldbuilding, rich painterly brushwork, atmospheric storytelling', lightingSuggestion: 'god_ray' },
  { id: 'ultra_realistic', labelKhmer: 'រូបភាពច្បាស់ដូចពិត 100%', labelEn: 'Ultra Photorealistic', gradient: 'from-slate-400 via-slate-800 to-black', promptExpansion: 'hyper-realistic photography, sharp focus, ray-traced lighting, physically accurate fabric textures, zero distortion, cinema-grade realism', lightingSuggestion: 'volumetric' },
  { id: 'custom', labelKhmer: 'ស្ទីលផ្ទាល់ខ្លួន (Custom)', labelEn: 'Custom Style', gradient: 'from-emerald-500 via-cyan-600 to-indigo-900', promptExpansion: 'unique custom artistic vision with cinematic movie poster composition and high dynamic range', lightingSuggestion: 'volumetric' },
];

// ── 3. 14 COMPOSITIONS ──
export const COMPOSITIONS: PosterCompositionItem[] = [
  { id: 'char_center', labelKhmer: 'តួអង្គកណ្តាល (Center Hero)', labelEn: 'Character Center', promptTag: 'powerful central character focal point, heroic symmetry, character dominating the central canvas with balanced background' },
  { id: 'char_left', labelKhmer: 'តួអង្គខាងឆ្វេង (Rule of Thirds Left)', labelEn: 'Character Left', promptTag: 'character positioned on the left third of frame, leaving clean negative space on the right for majestic typography and scenery' },
  { id: 'char_right', labelKhmer: 'តួអង្គខាងស្តាំ (Rule of Thirds Right)', labelEn: 'Character Right', promptTag: 'character positioned on the right third of frame, looking across toward the open horizon, cinematic breathing room' },
  { id: 'multi_char', labelKhmer: 'តួអង្គច្រើននាក់ (Ensemble Cast)', labelEn: 'Multiple Characters', promptTag: 'ensemble cast arrangement, main hero in foreground, supporting companions flanking sides, villain silhouette looming in background' },
  { id: 'closeup_portrait', labelKhmer: 'រូបថតផ្ទៃមុខជិត (Intense Close-up)', labelEn: 'Close-up Portrait', promptTag: 'dramatic extreme close-up portrait of face, intense piercing eyes, sweat, subtle tears or battle scars, cinematic emotional weight' },
  { id: 'full_body', labelKhmer: 'ពេញមួយតួខ្លួន (Full Body Showcase)', labelEn: 'Full Body Stance', promptTag: 'full body character showcase, head to toe costume details, majestic stance grounded on battlefield or floating above peaks' },
  { id: 'wide_cinematic', labelKhmer: 'ប្លង់ទូលាយភាពយន្ត (Wide Anamorphic)', labelEn: 'Wide Cinematic Shot', promptTag: 'sweeping wide cinematic shot, lone traveler standing before colossal ancient monuments, immense sense of scale' },
  { id: 'battle_scene', labelKhmer: 'សមរភូមិប្រយុទ្ធ (Fierce Combat)', labelEn: 'Battle Scene', promptTag: 'intense mid-combat clash, crossing blades with sparks flying, dynamic action blur, swirling debris and shockwave rings' },
  { id: 'flying_char', labelKhmer: 'តួអង្គហោះហើរ (Ascending Heaven)', labelEn: 'Flying / Ascending', promptTag: 'character gracefully ascending into the skies, flowing fabric floating against gravity, aerial perspective looking down at mountains' },
  { id: 'walking_char', labelKhmer: 'តួអង្គដើរទៅមុខ (Determined Walk)', labelEn: 'Walking Forward', promptTag: 'character walking toward camera with steadfast determination, cape billowing in the wind, smoke parting around footsteps' },
  { id: 'sitting_char', labelKhmer: 'តួអង្គគង់លើរាជបល្ល័ង្ក (Throne)', labelEn: 'Sitting on Throne', promptTag: 'emperor seated imperiously upon an ornate stone or golden throne, resting chin on hand, looking down with sovereign authority' },
  { id: 'hero_pose', labelKhmer: 'ក្បាច់តួឯក (Heroic Pose)', labelEn: 'Hero Pose', promptTag: 'classic low angle triumphant hero pose, cape billowing, one hand holding enchanted weapon, dawn breaking behind shoulders' },
  { id: 'villain_pose', labelKhmer: 'ក្បាច់តួកាច (Villain Silhouette)', labelEn: 'Villain Looming', promptTag: 'ominous villain towering in the dark background with glowing eyes, casting a sinister shadow over the protagonist' },
  { id: 'group_poster', labelKhmer: 'ក្រុមវីរបុរស (Avengers Pyramid)', labelEn: 'Group Poster', promptTag: 'pyramid triangular group composition, masterfully composed theatrical ensemble key visual with layered foreground and background' },
];

// ── 4. 15 LIGHTING PRESETS ──
export const LIGHTING_PRESETS: PosterLightingItem[] = [
  { id: 'golden_light', labelKhmer: 'ពន្លឺមាសអាទិទេព', labelEn: 'Golden Divine Light', colorHex: '#f59e0b', promptTag: 'warm golden divine sunlight streaming down, gilded rim reflections, warm dust motes floating' },
  { id: 'moon_light', labelKhmer: 'ពន្លឺព្រះច័ន្ទត្រជាក់', labelEn: 'Ethereal Moonlight', colorHex: '#93c5fd', promptTag: 'cool silver moonlight, midnight blue ambience, soft cyan highlights, mysterious nocturnal atmosphere' },
  { id: 'sunrise', labelKhmer: 'ពន្លឺព្រះអាទិត្យរះ', labelEn: 'Majestic Sunrise', colorHex: '#fb923c', promptTag: 'fresh golden-peach sunrise rays piercing through morning mist, glowing horizon line' },
  { id: 'sunset', labelKhmer: 'ពន្លឺថ្ងៃរៀបលិច', labelEn: 'Dramatic Sunset', colorHex: '#f43f5e', promptTag: 'fiery crimson and violet sunset, silhouettes against burning sky, deep emotional twilight' },
  { id: 'heavenly_light', labelKhmer: 'ពន្លឺឋានសួគ៌ពិសិដ្ឋ', labelEn: 'Heavenly Divine Light', colorHex: '#fef08a', promptTag: 'blinding sacred heavenly beams radiating from swirling clouds above, angelic illumination' },
  { id: 'blue_lightning', labelKhmer: 'ពន្លឺរន្ទះខៀវ', labelEn: 'Blue Electric Lightning', colorHex: '#38bdf8', promptTag: 'violent electric cyan lightning bursts illuminating the subject in high-contrast blue flash' },
  { id: 'red_fire', labelKhmer: 'ពន្លឺភ្លើងកម្អែក្រហម', labelEn: 'Blazing Red Fire', colorHex: '#ef4444', promptTag: 'ferocious red and orange fire glow from below, casting dynamic upward shadows and flying embers' },
  { id: 'purple_energy', labelKhmer: 'ថាមពលពណ៌ស្វាយ', labelEn: 'Purple Mystic Energy', colorHex: '#a855f7', promptTag: 'radiant arcane purple energy swirls, violet phosphorescence, ethereal otherworldly aura' },
  { id: 'white_divine', labelKhmer: 'ពន្លឺសបរិសុទ្ធ', labelEn: 'Pure White Radiance', colorHex: '#ffffff', promptTag: 'pure pristine white divine backlight, angelic corona, high key rim lighting' },
  { id: 'dark_shadow', labelKhmer: 'ស្រមោលងងឹត Chiaroscuro', labelEn: 'Deep Shadow (Chiaroscuro)', colorHex: '#475569', promptTag: 'dramatic Rembrandt chiaroscuro lighting, half of the face carved in deep velvety darkness' },
  { id: 'neon_light', labelKhmer: 'ពន្លឺ Neon ភ្លោះ', labelEn: 'Dual-Tone Neon', colorHex: '#ec4899', promptTag: 'bold dual-tone neon lighting with magenta on the left side and cyan on the right side' },
  { id: 'volumetric', labelKhmer: 'ពន្លឺធ្លុះអ័ព្ទ Volumetric', labelEn: 'Volumetric Fog Rays', colorHex: '#cbd5e1', promptTag: 'tangible volumetric light beams slicing through heavy atmospheric haze and mist' },
  { id: 'rim_light', labelKhmer: 'ពន្លឺរំលេចគែម Rim Light', labelEn: 'Cinematic Rim Light', colorHex: '#facc15', promptTag: 'razor-sharp edge rim lighting outlining the character silhouette against the dark background' },
  { id: 'back_light', labelKhmer: 'ពន្លឺចាំងពីក្រោយ Backlight', labelEn: 'Halo Backlight', colorHex: '#e2e8f0', promptTag: 'intense backlight creating a glowing corona around the hair and shoulders, lens flare' },
  { id: 'god_ray', labelKhmer: 'ពន្លឺចែងចាំង God Rays', labelEn: 'Crepuscular God Rays', colorHex: '#fde047', promptTag: 'spectacular crepuscular god rays breaking through celestial cloud formations' },
];

// ── 5. COLOR GRADING & MOODS ──
export const COLOR_GRADES: { id: PosterColorGradeId; label: string; hex: string }[] = [
  { id: 'gold', label: 'Gold (មាស)', hex: '#eab308' },
  { id: 'blue', label: 'Blue (ខៀវ)', hex: '#3b82f6' },
  { id: 'red', label: 'Red (ក្រហម)', hex: '#ef4444' },
  { id: 'purple', label: 'Purple (ស្វាយ)', hex: '#a855f7' },
  { id: 'white', label: 'White (ស)', hex: '#f8fafc' },
  { id: 'black', label: 'Black (ខ្មៅ)', hex: '#18181b' },
  { id: 'cyan', label: 'Cyan (ផ្ទៃមេឃ)', hex: '#06b6d4' },
  { id: 'orange', label: 'Orange (ទឹកក្រូច)', hex: '#f97316' },
  { id: 'silver', label: 'Silver (ប្រាក់)', hex: '#94a3b8' },
  { id: 'emerald', label: 'Emerald (ត្បូងមរកត)', hex: '#10b981' },
];

export const MOODS: { id: PosterMoodId; label: string; tag: string }[] = [
  { id: 'cinematic', label: 'Cinematic (ភាពយន្ត)', tag: 'theatrical color grading, teal and orange palette, cinematic contrast' },
  { id: 'high_contrast', label: 'High Contrast (ច្បាស់ដិត)', tag: 'crushed blacks, bright specular highlights, high visual punch' },
  { id: 'soft', label: 'Soft & Dreamy (ស្រទន់)', tag: 'gentle pastel tones, diffused highlight roll-off, nostalgic warmth' },
  { id: 'dark', label: 'Dark & Moody (អាប់អួ)', tag: 'low key lighting, subdued desaturated tones, mysterious gloom' },
  { id: 'vibrant', label: 'Vibrant (ស្រស់ឆើត)', tag: 'saturated rich hues, punchy anime colors, vivid visual excitement' },
  { id: 'luxury', label: 'Royal Luxury (ថ្លៃថ្នូរ)', tag: 'gold and obsidian black palette, royal emerald, diamond brilliance' },
  { id: 'fantasy', label: 'Ethereal Fantasy (វេទមន្ត)', tag: 'magical cyan and violet color harmony, shimmering iridescence' },
  { id: 'ancient', label: 'Ancient Myth (បុរាណ)', tag: 'warm amber, cinnabar red, aged parchment texture and tone' },
  { id: 'cold', label: 'Freezing Cold (ត្រជាក់)', tag: 'ice blue, steel grey, frosty white, winter chills' },
  { id: 'warm', label: 'Warm Sunset (កក់ក្តៅ)', tag: 'golden hour amber, honey peach, warm romantic glow' },
];

// ── 6. 7 ASPECT RATIOS ──
export const ASPECT_RATIOS: AspectRatioPreset[] = [
  { id: '2:3', label: '2:3 Theatrical Poster', platform: 'ភាពយន្ត / Poster', ratio: 2 / 3, width: 1000, height: 1500 },
  { id: '9:16', label: '9:16 TikTok / Reel / Story', platform: 'TikTok / Story', ratio: 9 / 16, width: 1080, height: 1920 },
  { id: '16:9', label: '16:9 YouTube / Landscape', platform: 'YouTube / កុន', ratio: 16 / 9, width: 1920, height: 1080 },
  { id: '1:1', label: '1:1 Facebook / Square', platform: 'Facebook / IG', ratio: 1 / 1, width: 1200, height: 1200 },
  { id: '4:5', label: '4:5 Instagram Portrait', platform: 'Instagram Post', ratio: 4 / 5, width: 1200, height: 1500 },
  { id: '3:4', label: '3:4 Classic Portrait', platform: 'Portrait', ratio: 3 / 4, width: 1200, height: 1600 },
  { id: '21:9', label: '21:9 Ultrawide Banner', platform: 'Banner / Header', ratio: 21 / 9, width: 2560, height: 1080 },
];

// ── 7. 13 TYPOGRAPHY 3D EFFECT SHADERS ──
export const TYPOGRAPHY_EFFECTS: {
  id: Typography3DEffect;
  labelKhmer: string;
  labelEn: string;
  cssStyle: React.CSSProperties;
  badgeStyle: React.CSSProperties;
}[] = [
  {
    id: 'gold_3d',
    labelKhmer: 'មាស 3D ឆ្លាក់ក្បាច់ (Flagship Gold)',
    labelEn: '3D Embossed Gold',
    cssStyle: {
      background: 'linear-gradient(180deg, #fff7cc 0%, #ffd700 25%, #d4af37 50%, #996515 80%, #ffd700 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      textShadow: '0 2px 0 #855c1b, 0 4px 0 #5e4113, 0 6px 0 #3d290a, 0 10px 25px rgba(255,215,0,0.7)',
      filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.9)) drop-shadow(0 0 15px rgba(255,215,0,0.5))',
    },
    badgeStyle: {
      background: 'linear-gradient(135deg, #ffd700, #b8860b)',
      color: '#000',
      boxShadow: '0 0 15px rgba(255,215,0,0.8)',
    },
  },
  {
    id: 'silver_3d',
    labelKhmer: 'ប្រាក់ពេជ្រ 3D Chrome',
    labelEn: '3D Polished Silver',
    cssStyle: {
      background: 'linear-gradient(180deg, #ffffff 0%, #e2e8f0 30%, #94a3b8 60%, #475569 90%, #ffffff 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      textShadow: '0 2px 0 #64748b, 0 4px 0 #334155, 0 8px 20px rgba(255,255,255,0.6)',
      filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.9))',
    },
    badgeStyle: {
      background: 'linear-gradient(135deg, #ffffff, #94a3b8)',
      color: '#0f172a',
      boxShadow: '0 0 15px rgba(255,255,255,0.7)',
    },
  },
  {
    id: 'diamond_3d',
    labelKhmer: 'ពេជ្រភ្លឺផ្លេក Diamond 3D',
    labelEn: '3D Diamond Prism',
    cssStyle: {
      background: 'linear-gradient(135deg, #e0f2fe 0%, #7dd3fc 25%, #38bdf8 50%, #bae6fd 75%, #ffffff 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      textShadow: '0 2px 0 #0284c7, 0 4px 0 #0369a1, 0 10px 30px rgba(56,189,248,0.8)',
      filter: 'drop-shadow(0 0 16px rgba(56,189,248,0.7))',
    },
    badgeStyle: {
      background: 'linear-gradient(135deg, #38bdf8, #0284c7)',
      color: '#fff',
      boxShadow: '0 0 20px rgba(56,189,248,0.9)',
    },
  },
  {
    id: 'fire',
    labelKhmer: 'អណ្តាតភ្លើងឆេះ Fire Blazing',
    labelEn: 'Blazing Fire',
    cssStyle: {
      background: 'linear-gradient(180deg, #fef08a 0%, #f97316 40%, #dc2626 70%, #7f1d1d 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      textShadow: '0 2px 0 #991b1b, 0 5px 0 #450a0a, 0 10px 25px rgba(239,68,68,0.8)',
      filter: 'drop-shadow(0 0 18px rgba(239,68,68,0.8))',
    },
    badgeStyle: {
      background: 'linear-gradient(135deg, #f97316, #dc2626)',
      color: '#fff',
      boxShadow: '0 0 18px rgba(239,68,68,0.8)',
    },
  },
  {
    id: 'ice',
    labelKhmer: 'ទឹកកកត្រជាក់ Frost Ice',
    labelEn: 'Frostbite Ice',
    cssStyle: {
      background: 'linear-gradient(180deg, #ffffff 0%, #bae6fd 40%, #38bdf8 80%, #0369a1 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      textShadow: '0 2px 0 #0284c7, 0 4px 0 #075985, 0 10px 20px rgba(186,230,253,0.9)',
      filter: 'drop-shadow(0 0 14px rgba(56,189,248,0.7))',
    },
    badgeStyle: {
      background: 'linear-gradient(135deg, #bae6fd, #38bdf8)',
      color: '#0c4a6e',
      boxShadow: '0 0 15px rgba(56,189,248,0.8)',
    },
  },
  {
    id: 'lightning',
    labelKhmer: 'រន្ទះផ្គរလាន់ Thunder Plasma',
    labelEn: 'Thunder Plasma',
    cssStyle: {
      background: 'linear-gradient(180deg, #ffffff 0%, #c4b5fd 35%, #8b5cf6 70%, #4c1d95 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      textShadow: '0 2px 0 #5b21b6, 0 4px 0 #2e1065, 0 12px 30px rgba(139,92,246,0.9)',
      filter: 'drop-shadow(0 0 16px rgba(139,92,246,0.8))',
    },
    badgeStyle: {
      background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
      color: '#fff',
      boxShadow: '0 0 16px rgba(139,92,246,0.8)',
    },
  },
  {
    id: 'neon',
    labelKhmer: 'Cyber Neon ភ្លើងពណ៌',
    labelEn: 'Cyber Neon',
    cssStyle: {
      color: '#22d3ee',
      textShadow: '0 0 5px #22d3ee, 0 0 10px #22d3ee, 0 0 20px #06b6d4, 0 0 40px #0891b2',
      filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.9))',
    },
    badgeStyle: {
      background: '#0891b2',
      color: '#ecfeff',
      boxShadow: '0 0 15px #22d3ee',
    },
  },
  {
    id: 'glow',
    labelKhmer: 'រស្មីភ្លឺ Glow Aura',
    labelEn: 'Holy Glow',
    cssStyle: {
      color: '#fef08a',
      textShadow: '0 0 8px #fef08a, 0 0 18px #f59e0b, 0 0 35px #d97706',
      filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.8))',
    },
    badgeStyle: {
      background: '#f59e0b',
      color: '#fff',
      boxShadow: '0 0 15px #f59e0b',
    },
  },
  {
    id: 'metallic',
    labelKhmer: 'ដែកថែប Titanium',
    labelEn: 'Titanium Steel',
    cssStyle: {
      background: 'linear-gradient(180deg, #94a3b8 0%, #cbd5e1 30%, #475569 65%, #1e293b 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      textShadow: '0 2px 0 #334155, 0 4px 0 #0f172a, 0 8px 16px rgba(0,0,0,0.8)',
      filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.9))',
    },
    badgeStyle: {
      background: 'linear-gradient(135deg, #64748b, #334155)',
      color: '#f8fafc',
      boxShadow: '0 0 10px rgba(0,0,0,0.6)',
    },
  },
  {
    id: 'stone',
    labelKhmer: 'ថ្មបុរាណ Ancient Stone',
    labelEn: 'Ancient Stone',
    cssStyle: {
      background: 'linear-gradient(180deg, #d6d3d1 0%, #a8a29e 40%, #78716c 75%, #44403c 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      textShadow: '0 2px 0 #292524, 0 4px 0 #1c1917, 0 8px 16px rgba(0,0,0,0.9)',
      filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.9))',
    },
    badgeStyle: {
      background: '#78716c',
      color: '#f5f5f4',
      boxShadow: '0 0 8px rgba(0,0,0,0.5)',
    },
  },
  {
    id: 'ancient_gold',
    labelKhmer: 'មាសបុរាណរាជវង្ស',
    labelEn: 'Dynastic Gold',
    cssStyle: {
      background: 'linear-gradient(180deg, #fef9c3 0%, #eab308 30%, #a16207 70%, #713f12 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      textShadow: '0 2px 0 #854d0e, 0 4px 0 #422006, 0 10px 24px rgba(234,179,8,0.7)',
      filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.9))',
    },
    badgeStyle: {
      background: 'linear-gradient(135deg, #eab308, #854d0e)',
      color: '#fefce8',
      boxShadow: '0 0 14px rgba(234,179,8,0.7)',
    },
  },
  {
    id: 'magic_energy',
    labelKhmer: 'ថាមពលមហិទ្ធិឫទ្ធិ (Magic Spirit)',
    labelEn: 'Cosmic Magic',
    cssStyle: {
      background: 'linear-gradient(180deg, #f0abfc 0%, #c084fc 35%, #818cf8 70%, #312e81 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      textShadow: '0 2px 0 #4c1d95, 0 5px 0 #1e1b4b, 0 12px 30px rgba(192,132,252,0.9)',
      filter: 'drop-shadow(0 0 18px rgba(168,85,247,0.8))',
    },
    badgeStyle: {
      background: 'linear-gradient(135deg, #c084fc, #6366f1)',
      color: '#fff',
      boxShadow: '0 0 18px rgba(192,132,252,0.9)',
    },
  },
  {
    id: 'glass',
    labelKhmer: 'កញ្ចក់ថ្លា Frost Glass',
    labelEn: 'Transparent Glass',
    cssStyle: {
      background: 'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.4) 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      textShadow: '0 2px 10px rgba(255,255,255,0.5)',
      filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.7))',
    },
    badgeStyle: {
      background: 'rgba(255,255,255,0.2)',
      backdropFilter: 'blur(8px)',
      color: '#fff',
      boxShadow: '0 0 12px rgba(255,255,255,0.3)',
    },
  },
];

// ── 8. SMART OVERLAYS ──
export const DEFAULT_OVERLAYS: PosterSmartOverlay[] = [
  { id: 'ov_dragon', type: 'dragon', name: '🐉 នាគរាជមាស (Golden Dragon)', visible: false, opacity: 90, blendMode: 'screen', scale: 100, posX: 50, posY: 30 },
  { id: 'ov_sword', type: 'sword', name: '⚔️ ដាវពន្លឺពិសិដ្ឋ (Divine Sword)', visible: false, opacity: 85, blendMode: 'color-dodge', scale: 80, posX: 50, posY: 60 },
  { id: 'ov_magic', type: 'magic_energy', name: '🔮 រង្វង់ថាមពលវេទមន្ត (Magic Aura)', visible: true, opacity: 80, blendMode: 'screen', scale: 100, posX: 50, posY: 75 },
  { id: 'ov_lightning', type: 'lightning', name: '⚡ រន្ទះបាញ់ (Lightning Arcs)', visible: false, opacity: 75, blendMode: 'screen', scale: 90, posX: 50, posY: 20 },
  { id: 'ov_fire', type: 'fire', name: '🔥 អណ្តាតភ្លើង (Embers & Fire)', visible: false, opacity: 70, blendMode: 'screen', scale: 100, posX: 50, posY: 85 },
  { id: 'ov_particles', type: 'particles', name: '✨ ធូលីមាសភ្លឺ (Golden Sparkles)', visible: true, opacity: 85, blendMode: 'screen', scale: 100, posX: 50, posY: 50 },
  { id: 'ov_clouds', type: 'clouds', name: '☁️ ពពកឋានសួគ៌ (Celestial Clouds)', visible: true, opacity: 70, blendMode: 'screen', scale: 100, posX: 50, posY: 80 },
  { id: 'ov_palace', type: 'palace', name: '🏯 រាជវាំងអណ្តែត (Floating Palace)', visible: false, opacity: 75, blendMode: 'normal', scale: 80, posX: 75, posY: 25 },
  { id: 'ov_moon', type: 'moon', name: '🌕 ព្រះច័ន្ទពេញវង់ (Mystic Moon)', visible: false, opacity: 85, blendMode: 'screen', scale: 70, posX: 80, posY: 20 },
  { id: 'ov_godrays', type: 'godrays', name: '☀️ ពន្លឺចែងចាំង (Heavenly God Rays)', visible: true, opacity: 75, blendMode: 'screen', scale: 100, posX: 50, posY: 10 },
];

// ── 9. PRE-MADE POSTER TEMPLATE LIBRARY ──
export interface PosterTemplatePreset {
  id: string;
  nameKhmer: string;
  nameEn: string;
  description: string;
  imageUrl: string;
  posterType: any;
  style: any;
  composition: any;
  lighting: any[];
  colorGrade: PosterColorGradeId;
  mood: PosterMoodId;
  aspectRatio: any;
  typography: {
    mainTitle: string;
    subtitle: string;
    tagline: string;
    badgeText: string;
    effect: Typography3DEffect;
    fontFamily: any;
    positionMode: any;
    posY: number;
    showOrnateCrest: boolean;
  };
  promptSnippet: string;
}

export const POSTER_TEMPLATES: PosterTemplatePreset[] = [
  {
    id: 'tpl_xianxia_flagship',
    nameKhmer: 'ពិភពថាមពលវេទមន្ត 3D (Flagship)',
    nameEn: 'Xianxia Immortal & Celestial Dragon',
    description: 'អាទិទេពសំពត់ស រាជវាំងលើពពក និងនាគរាជមាសដ៏មហិមា ជាមួយចំណងជើងអក្សរ 3D មាសឆ្លាក់ក្បាច់',
    imageUrl: '/samples/posterforge_xianxia_flagship.jpg',
    posterType: 'xianxia',
    style: 'xianxia_heaven',
    composition: 'char_center',
    lighting: ['golden_light', 'heavenly_light', 'god_ray'],
    colorGrade: 'gold',
    mood: 'luxury',
    aspectRatio: '2:3',
    typography: {
      mainTitle: 'ពិភពថាមពលវេទមន្ត',
      subtitle: 'MAGIC ENERGY WORLD',
      tagline: 'រឿងភាគគំនូរជីវចលចិន 3D ដ៏អស្ចារ្យបំផុតប្រចាំឆ្នាំ',
      badgeText: '3D',
      effect: 'gold_3d',
      fontFamily: 'Koulen',
      positionMode: 'bottom',
      posY: 80,
      showOrnateCrest: true,
    },
    promptSnippet: 'Epic cinematic Xianxia fantasy theatrical poster featuring a majestic immortal cultivator in flowing white and gold ancient silk robes, standing above floating celestial mountains, massive golden glowing celestial dragon formed from clouds in the sky behind, heavenly floating Taoist temples, spiritual aura, volumetric god rays, hyper-detailed rendering',
  },
  {
    id: 'tpl_immortal_god',
    nameKhmer: 'អាទិទេពពិភពទេវតា',
    nameEn: 'Immortal God of Heaven',
    description: 'ព្រះអាទិទេពត្រាស់ដឹង ហ៊ុមព័ទ្ធដោយរស្មីព្រះអាទិត្យ និងគម្ពីរមន្តអាគមមាស',
    imageUrl: '/cinematic_preview.jpg',
    posterType: 'cultivation',
    style: 'golden_immortal',
    composition: 'hero_pose',
    lighting: ['golden_light', 'white_divine'],
    colorGrade: 'gold',
    mood: 'cinematic',
    aspectRatio: '2:3',
    typography: {
      mainTitle: 'អាទិទេពពិភពទេវតា',
      subtitle: 'IMMORTAL SOVEREIGN OF THE HEAVENS',
      tagline: 'ដំណើរឆ្ពោះទៅកាន់ភាពអមតៈដែលគ្មានអ្នកណាអាចរារាំងបាន',
      badgeText: 'ភាគ ១',
      effect: 'ancient_gold',
      fontFamily: 'Koulen',
      positionMode: 'bottom',
      posY: 82,
      showOrnateCrest: true,
    },
    promptSnippet: 'Golden immortal god standing upon a lotus of pure divine light, golden meridians glowing through celestial robes, immense halo behind the head, grand floating palaces',
  },
  {
    id: 'tpl_demon_emperor',
    nameKhmer: 'អធិរាជបិសាចងងឹត',
    nameEn: 'Demon Emperor of the Abyss',
    description: 'មេទ័ពបិសាចដ៏ឃោរឃៅ ពាសដែកខ្មៅរលោង ភ្លើងក្រហមឆេះ និងរន្ទះពណ៌ស្វាយ',
    imageUrl: '/cinematic_preview.jpg',
    posterType: 'dark_fantasy',
    style: 'demon_realm',
    composition: 'villain_pose',
    lighting: ['purple_energy', 'red_fire'],
    colorGrade: 'red',
    mood: 'dark',
    aspectRatio: '2:3',
    typography: {
      mainTitle: 'អធិរាជបិសាច',
      subtitle: 'THE ABYSSAL EMPEROR',
      tagline: 'ពេលដែលមេឃងងឹតពិភពលោកនឹងត្រូវរលាយសាបសូន្យ',
      badgeText: 'VIP',
      effect: 'fire',
      fontFamily: 'Moul',
      positionMode: 'bottom',
      posY: 82,
      showOrnateCrest: true,
    },
    promptSnippet: 'Terrifying demon emperor in horned obsidian armor, glowing crimson eyes, blood-red moon, volcanic brimstone, swirling dark purple energy',
  },
  {
    id: 'tpl_heavenly_war',
    nameKhmer: 'សង្គ្រាមឋានសួគ៌',
    nameEn: 'Heavenly War Chronicle',
    description: 'សមរភូមិប្រយុទ្ធលើអាកាស ដាវរាប់ពាន់ហោះហើរ និងនាគរាជពីរប៉ះទង្គិចគ្នា',
    imageUrl: '/cinematic_preview.jpg',
    posterType: 'wuxia',
    style: 'dragon_fantasy',
    composition: 'battle_scene',
    lighting: ['blue_lightning', 'god_ray'],
    colorGrade: 'blue',
    mood: 'high_contrast',
    aspectRatio: '2:3',
    typography: {
      mainTitle: 'សង្គ្រាមឋានសួគ៌',
      subtitle: 'CHRONICLES OF CELESTIAL WAR',
      tagline: 'ការប្រយុទ្ធចុងក្រោយដើម្បីដណ្តើមគ្រងរាជបល្ល័ង្ក',
      badgeText: 'EP 100',
      effect: 'diamond_3d',
      fontFamily: 'Koulen',
      positionMode: 'bottom',
      posY: 80,
      showOrnateCrest: true,
    },
    promptSnippet: 'Epic aerial clash between golden dragon and silver ice dragon, thousands of flying swords spiraling through the thunderous storm, shattering celestial peaks',
  },
  {
    id: 'tpl_tiktok_donghua',
    nameKhmer: 'TikTok 9:16 គម្របវីដេអូទាន់សម័យ',
    nameEn: 'TikTok Viral Donghua Cover',
    description: 'ទម្រង់ 9:16 ច្បាស់ត្រជាក់ភ្នែក ស័ក្តិសមបំផុតសម្រាប់ Shorts, Reels និង TikTok',
    imageUrl: '/samples/posterforge_xianxia_flagship.jpg',
    posterType: 'tiktok_cover',
    style: 'donghua',
    composition: 'char_center',
    lighting: ['golden_light', 'rim_light'],
    colorGrade: 'gold',
    mood: 'vibrant',
    aspectRatio: '9:16',
    typography: {
      mainTitle: 'មហាយុទ្ធសិល្ប៍ 3D',
      subtitle: 'KHMER DUBBING PRO',
      tagline: 'ទស្សនាភាគពេញនៅទីនេះ!',
      badgeText: 'HD 1080P',
      effect: 'gold_3d',
      fontFamily: 'Koulen',
      positionMode: 'bottom',
      posY: 84,
      showOrnateCrest: false,
    },
    promptSnippet: 'Vertical 9:16 high visual impact Donghua 3D key visual, explosive central action, clean top and bottom framing, optimized for mobile screens',
  },
  {
    id: 'tpl_youtube_viral',
    nameKhmer: 'YouTube Thumbnail 16:9 ស៊ីអារម្មណ៍',
    nameEn: 'High CTR YouTube Thumbnail',
    description: 'ទម្រង់ 16:9 អក្សរធំៗច្បាស់ៗ គែមពន្លឺដិត ជំរុញចំនួនចុចទស្សនា (High CTR)',
    imageUrl: '/samples/posterforge_xianxia_flagship.jpg',
    posterType: 'youtube_thumbnail',
    style: 'cinematic',
    composition: 'char_right',
    lighting: ['rim_light', 'golden_light'],
    colorGrade: 'cyan',
    mood: 'high_contrast',
    aspectRatio: '16:9',
    typography: {
      mainTitle: 'ភាគ ២២ អាថ៌កំបាំង',
      subtitle: 'FINAL REVELATION',
      tagline: 'ទម្លាយការពិតដែលលាក់ទុក ១០០ ឆ្នាំ!',
      badgeText: 'FULL HD',
      effect: 'gold_3d',
      fontFamily: 'Koulen',
      positionMode: 'vertical_left',
      posY: 50,
      showOrnateCrest: false,
    },
    promptSnippet: 'Dynamic 16:9 widescreen YouTube thumbnail, emotional heroic protagonist on right, mysterious glowing portal on left, bold lighting, cinematic contrast',
  },
];
