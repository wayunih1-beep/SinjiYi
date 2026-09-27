'use client';

import {useCallback,useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,ArrowUpRight,Check,ChevronLeft,ChevronRight,Clapperboard,Compass,ExternalLink,Film,Info,Heart,LoaderCircle,Play,Search,SlidersHorizontal,Star,Tv,X} from 'lucide-react';
import {Dialog,DialogContent,DialogDescription,DialogTitle} from '@/components/ui/dialog';
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '@/components/ui/select';
import {Tabs,TabsContent,TabsList,TabsTrigger} from '@/components/ui/tabs';
import {Skeleton} from '@/components/ui/skeleton';
import {Empty,EmptyDescription,EmptyHeader,EmptyMedia,EmptyTitle} from '@/components/ui/empty';
import type {Anime,Catalog,Detail} from '@/lib/anime';
import {genreOptions} from '@/lib/anime';
import {publicRequest} from '@/lib/public-api';

type View='discover'|'series'|'movies'|'airing'|'favorites';
type ToolContext={registerTool:(tool:{name:string;title:string;description:string;inputSchema:object;annotations:object;execute:(input:unknown)=>Promise<unknown>},options:{signal:AbortSignal})=>void|Promise<void>};

async function getJson<T>(url:string,signal?:AbortSignal):Promise<T>{
  try { return await publicRequest(url,signal) as T; } catch(e) { if(signal?.aborted) throw e; }
  const r=await fetch(url,{signal});const data=await r.json() as T & {error?:string};if(!r.ok)throw new Error(data.error || 'Something went wrong. Please try again.');return data;
}
function Art({src,alt,className='',eager=false}:{src:string;alt:string;className?:string;eager?:boolean}){
  const [failed,setFailed]=useState(false);
  useEffect(()=>setFailed(false),[src]);
  return src&&!failed?<img className={className} src={src} alt={alt} loading={eager?'eager':'lazy'} decoding="async" onError={()=>setFailed(true)}/>:<div className={`${className} image-fallback`} role="img" aria-label={alt}><Clapperboard size={28}/></div>;
}
function Brand(){return <span className="brand"><span className="brand-symbol" aria-hidden="true"><Play size={20} fill="currentColor" strokeWidth={0}/></span>Sinji<span>Yi</span><span className="brand-period">.</span></span>;}
function AnimeCard({anime,onOpen,index}:{anime:Anime;onOpen:(a:Anime)=>void;index:number}){
  return <button className="anime-card" onClick={()=>onOpen(anime)} aria-label={`View ${anime.title}`}>
    <div className="poster-wrap"><Art src={anime.poster} alt={`${anime.title} poster`} eager={index<6}/><span className="card-format">{anime.format==='TV'?'SERIES':anime.format.toUpperCase()}</span><span className="card-play"><Play fill="currentColor" size={21}/></span>{anime.score&&<span className="score"><Star size={12} fill="currentColor"/>{anime.score}</span>}</div>
    <h3>{anime.title}</h3><p>{anime.year || 'Year unavailable'}<span>·</span>{anime.episodes?`${anime.episodes} episode${anime.episodes===1?'':'s'}`:anime.status==='current'?'Ongoing':'Anime'}</p>
  </button>;
}
function NoResults({title,description}:{title:string;description:string}){
  return <Empty className="empty-state"><EmptyHeader><EmptyMedia variant="icon"><Search/></EmptyMedia><EmptyTitle>{title}</EmptyTitle><EmptyDescription>{description}</EmptyDescription></EmptyHeader></Empty>;
}

export default function AnimeApp({initial,featured,airing}:{initial:Anime[];featured:Anime;airing:Anime[]}){
  const [view,setView]=useState<View>('discover');
  const [favorites,setFavorites]=useState<Anime[]>([]);const [saveError,setSaveError]=useState('');
  useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem('sinjiyi-favorites')||'[]');if(Array.isArray(saved))setFavorites(saved.filter(a=>a && typeof a.id==='string' && /^\d+$/.test(a.id) && typeof a.title==='string' && typeof a.synopsis==='string' && (a.poster?.startsWith('/assets/') || a.poster?.startsWith('https://'))).slice(0,200));}catch{}},[]);
  const toggleFavorite=(anime:Anime)=>{const next=favorites.some(a=>a.id===anime.id)?favorites.filter(a=>a.id!==anime.id):[anime,...favorites].slice(0,200);setFavorites(next);try{localStorage.setItem('sinjiyi-favorites',JSON.stringify(next));setSaveError('');}catch{setSaveError('Favorites could not be saved on this browser.');}};
  const [query,setQuery]=useState('');const [activeQuery,setActiveQuery]=useState('');
  const [genre,setGenre]=useState('All genres');const [sort,setSort]=useState('popular');
  const [page,setPage]=useState(1);const [items,setItems]=useState(initial);const [hasMore,setHasMore]=useState(true);
  const [loading,setLoading]=useState(false);const [error,setError]=useState('');const [notice,setNotice]=useState('');const [retry,setRetry]=useState(0);
  const [selected,setSelected]=useState<Anime|null>(null);const [detail,setDetail]=useState<Detail|null>(null);const [detailLoading,setDetailLoading]=useState(false);const [detailError,setDetailError]=useState('');
  const [player,setPlayer]=useState(false);const [episodeLoading,setEpisodeLoading]=useState(false);const [episodeError,setEpisodeError]=useState('');
  const [activeTab,setActiveTab]=useState('overview');const [heroIndex,setHeroIndex]=useState(0);
  const searchRef=useRef<HTMLInputElement>(null);const catalogRef=useRef<HTMLElement>(null);const requestSequence=useRef(0);
  const heroes=[featured,...initial.slice(0,2)];const hero=heroes[heroIndex];
  const browsing=activeQuery!=='' || genre!=='All genres' || view!=='discover' || sort!=='popular' || page>1;
  const goHome=()=>{setView('discover');setQuery('');setActiveQuery('');setGenre('All genres');setSort('popular');setPage(1);window.scrollTo({top:0,behavior:'smooth'});};
  const switchView=(next:View)=>{setView(next);setPage(1);setQuery('');setActiveQuery('');setGenre('All genres');};
  useEffect(()=>{const t=setTimeout(()=>{setActiveQuery(query.trim());setPage(1);},350);return()=>clearTimeout(t);},[query]);
  useEffect(()=>{
    const controller=new AbortController();if(view==='favorites'){setLoading(false);setError('');setNotice('');return()=>controller.abort();}setLoading(true);setError('');
    const p=new URLSearchParams({q:activeQuery,genre,view,sort,page:String(page)});
    getJson<Catalog>(`/api/catalog?${p}`,controller.signal).then(r=>{setItems(r.items);setHasMore(r.hasMore);setNotice(r.notice || '');}).catch(e=>{if(e.name!=='AbortError')setError(e.message);}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return()=>controller.abort();
  },[activeQuery,genre,view,sort,page,retry]);
  useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==='/' && !['INPUT','TEXTAREA'].includes((e.target as HTMLElement).tagName) && !selected){e.preventDefault();searchRef.current?.focus();}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[selected]);

  const openAnime=useCallback(async(anime:Anime,play=false)=>{
    const sequence=++requestSequence.current;setSelected(anime);setDetail(null);setPlayer(play);setActiveTab('overview');setDetailLoading(true);setDetailError('');setEpisodeError('');setEpisodeLoading(false);
    try {const r=await getJson<Detail>(`/api/anime/${anime.id}`);if(sequence===requestSequence.current)setDetail(r);}
    catch(e){if(sequence===requestSequence.current)setDetailError((e as Error).message);}
    finally{if(sequence===requestSequence.current)setDetailLoading(false);}
  },[]);
  const loadEpisodes=async()=>{
    if(!detail)return;setEpisodeLoading(true);setEpisodeError('');const sequence=requestSequence.current;
    try {const r=await getJson<{episodes:Detail['episodes'];hasMore:boolean}>(`/api/episodes/${detail.anime.id}?offset=${detail.episodes.length}`);if(sequence===requestSequence.current)setDetail(d=>d?{...d,episodes:[...d.episodes,...r.episodes],hasMoreEpisodes:r.hasMore}:d);}
    catch{if(sequence===requestSequence.current)setEpisodeError('More episodes could not be loaded. Please try again.');}
    finally{if(sequence===requestSequence.current)setEpisodeLoading(false);}
  };
  useEffect(()=>{
    const context=(document as Document & {modelContext?:ToolContext}).modelContext;if(!context?.registerTool)return;
    const lifecycle=new AbortController();
    const tools=[{
      name:'search_anime',title:'Search anime',description:'Search the SinjiYi anime catalog and display the results.',inputSchema:{type:'object',properties:{query:{type:'string',minLength:1,maxLength:100}},required:['query'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:true},
      execute:async(input:unknown)=>{const q=(input as {query?:unknown})?.query;if(typeof q!=='string'||!q.trim()||q.length>100)throw new Error('Enter a search query between 1 and 100 characters.');const r=await getJson<Catalog>(`/api/catalog?q=${encodeURIComponent(q.trim())}`);setView('discover');setGenre('All genres');setSort('popular');setPage(1);setQuery(q.trim());setActiveQuery(q.trim());setItems(r.items);setHasMore(r.hasMore);setNotice(r.notice || '');await new Promise(resolve=>requestAnimationFrame(()=>resolve(null)));return{results:r.items.map(a=>({id:a.id,title:a.title})),cached:!!r.cached};}
    }];
    for(const tool of tools){try{void Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}}
    return()=>lifecycle.abort();
  },[]);
  const changePage=(n:number)=>{setPage(n);catalogRef.current?.scrollIntoView({behavior:'smooth',block:'start'});};
  const current=detail?.anime || selected;
  const displayItems=view==='favorites'?favorites.filter(a=>!activeQuery||a.title.toLowerCase().includes(activeQuery.toLowerCase())).sort((a,b)=>sort==='rating'?Number(b.score)-Number(a.score):0):items;

  return <>
    <a className="skip-link" href="#catalog">Skip to anime catalog</a>
    <header className="site-header"><div className="header-inner">
      <button className="brand-button" aria-label="SinjiYi home" onClick={goHome}><Brand/></button>
      <nav aria-label="Main navigation">{([['discover','Discover'],['series','Series'],['movies','Movies']] as const).map(([key,label])=><button key={key} className={view===key?'nav-link active':'nav-link'} aria-current={view===key?'page':undefined} onClick={()=>switchView(key)}>{label}</button>)}</nav>
      <div className="search-box"><Search size={18}/><input ref={searchRef} aria-label="Search anime" placeholder="Find your next anime" value={query} maxLength={100} onChange={e=>setQuery(e.target.value)}/>{query?<button className="icon-button" aria-label="Clear search" onClick={()=>{setQuery('');searchRef.current?.focus();}}><X size={16}/></button>:<kbd>/</kbd>}</div>
      <button className={`favorites-button ${view==='favorites'?'active':''}`} aria-label="Your favorites" aria-pressed={view==='favorites'} onClick={()=>switchView('favorites')}><Heart size={20} fill={view==='favorites'?'currentColor':'none'}/>{favorites.length>0&&<span>{favorites.length}</span>}</button>
    </div></header>
    <main>
      {!browsing&&<section className="hero page-width" aria-label="Featured anime">
        <Art src={hero.cover || hero.poster} alt={`${hero.title} artwork`} className="hero-art" eager/>
        <div className="hero-shade"/>
        <div className="hero-content"><div className="eyebrow"><span className="tiny-rule"/>IN THE SPOTLIGHT</div>
          <h1>{hero.id===featured.id?<><span className="hero-title-main">Frieren</span><span className="hero-title-sub">Beyond Journey’s End</span></>:hero.title}</h1>
          <div className="hero-meta">{hero.score&&<span className="hero-rating"><Star size={15} fill="currentColor"/>{hero.score}</span>}<span>{hero.year}</span><span>{hero.format}</span>{hero.episodes&&<span>{hero.episodes} episodes</span>}{hero.ageRating&&<span className="age-badge">{hero.ageRating}</span>}</div>
          <p className="hero-synopsis">{hero.synopsis}</p>
          <div className="hero-actions">{hero.trailerId&&<button className="button primary" onClick={()=>openAnime(hero,true)}><Play size={17} fill="currentColor"/>Watch trailer</button>}<button className="button glass" onClick={()=>openAnime(hero)}><Info size={18}/>View anime</button></div>
        </div>
        <div className="hero-side-note" aria-hidden="true">{hero.originalTitle}</div>
        <div className="hero-bottom"><div className="hero-pagination">{heroes.map((h,i)=><button key={h.id} className={i===heroIndex?'active':''} onClick={()=>setHeroIndex(i)} aria-label={`Feature ${h.title}`} aria-pressed={i===heroIndex}><span/></button>)}</div><div className="hero-arrows"><span>{String(heroIndex+1).padStart(2,'0')}<i>/ 03</i></span><button className="icon-button" onClick={()=>setHeroIndex((heroIndex+2)%3)} aria-label="Previous featured anime"><ChevronLeft size={20}/></button><button className="icon-button" onClick={()=>setHeroIndex((heroIndex+1)%3)} aria-label="Next featured anime"><ChevronRight size={20}/></button></div></div>
      </section>}

      <section className="catalog-section page-width" id="catalog" ref={catalogRef} aria-busy={loading}>
        <div className="section-heading"><div><p className="section-kicker">{activeQuery?'FIND YOUR NEXT STORY':view==='airing'?'CURRENTLY AIRING':'THE COLLECTION'}</p><h2>{activeQuery?`Results for “${activeQuery}”`:view==='favorites'?'Your favorites.':view==='movies'?'Movie night, sorted.':view==='series'?'One more episode.':view==='airing'?'On air':'Find your next favorite.'}</h2></div>
          <Select value={sort} onValueChange={v=>{setSort(v);setPage(1);}}><SelectTrigger className="sort-trigger" aria-label="Sort anime"><SlidersHorizontal size={15}/><SelectValue/></SelectTrigger><SelectContent><SelectItem value="popular">Most popular</SelectItem><SelectItem value="rating">Highest rated</SelectItem></SelectContent></Select>
        </div>
        {view!=='favorites'&&<div className="genre-row" aria-label="Filter by genre">{genreOptions.map(g=><button key={g} className={g===genre?'genre-chip selected':'genre-chip'} aria-pressed={g===genre} onClick={()=>{setGenre(g);setPage(1);}}>{g==='All genres'&&<span className="genre-grid"><i/><i/><i/><i/></span>}{g}</button>)}</div>}
        {notice&&<p className="catalog-notice" role="status"><Info size={16}/>{notice}<button onClick={()=>setRetry(x=>x+1)}>Retry</button></p>}
        {error?<div className="error-state" role="alert"><Info size={28}/><h3>Taking a little longer than usual.</h3><p>{error}</p><button className="button secondary" onClick={()=>setRetry(x=>x+1)}>Try again</button></div>:loading&&browsing?<div className="anime-grid" aria-label="Loading anime">{Array.from({length:12},(_,i)=><div key={i}><Skeleton className="poster-skeleton"/><Skeleton className="title-skeleton"/></div>)}</div>:displayItems.length?<div className={`anime-grid ${loading?'refreshing':''}`}>{displayItems.slice(0,view==='favorites'?200:browsing?20:12).map((a,i)=><AnimeCard key={a.id} anime={a} index={i} onOpen={a=>openAnime(a)}/>)}</div>:<NoResults title={view==='favorites'?"Your next favorites belong here.":"No anime found"} description={view==='favorites'?"Open an anime and tap the heart to save it on this device.":"Try another title or choose a different genre."}/>}
        {view!=='favorites'&&!error&&!loading&&(hasMore||page>1)&&<div className="pagination-row">{browsing?<><button className="button secondary" disabled={page===1} onClick={()=>changePage(page-1)}><ArrowLeft size={16}/>Previous</button><span>Page {page}</span><button className="button secondary" disabled={!hasMore} onClick={()=>changePage(page+1)}>Next<ArrowRight size={16}/></button></>:<button className="button catalog-more" onClick={()=>switchView('series')}>Explore all series<ArrowRight size={16}/></button>}</div>}
      </section>
      {!browsing&&<section className="airing-section page-width"><div className="section-heading"><div><p className="section-kicker">KEEP UP WITH THE STORY</p><h2>On air</h2></div><button className="text-button" onClick={()=>switchView('airing')}>View all<ArrowUpRight size={17}/></button></div><div className="airing-grid">{airing.slice(0,4).map(a=><button key={a.id} className="airing-card" onClick={()=>openAnime(a)}><Art src={a.poster} alt={`${a.title} poster`}/><span><span className="airing-label">AIRING</span><strong>{a.title}</strong><span className="airing-meta">{a.format} · {a.year}{a.score&&<> · <Star size={12}/>{a.score}</>}</span></span><ChevronRight size={17}/></button>)}</div></section>}
    </main>
    <footer className="page-width"><div className="footer-top"><button className="brand-button" aria-label="Back to SinjiYi home" onClick={goHome}><Brand/></button><p>Good stories stay with you.</p><a href="https://github.com/hummingbird-me/api-docs" target="_blank" rel="noopener noreferrer">Catalog by Kitsu<ArrowUpRight size={14}/></a></div><div className="footer-bottom"><span>SinjiYi © {new Date().getFullYear()}</span><p>Trailers play here. Full episodes open on the listed streaming services. Availability varies by region.</p></div></footer>

    <Dialog open={!!selected} onOpenChange={open=>{if(!open){requestSequence.current++;setSelected(null);setDetail(null);setPlayer(false);}}}>
      <DialogContent className="anime-dialog" aria-describedby="anime-description">
        {current&&<>
          <div className="dialog-stage">
            {player&&current.trailerId?<iframe key={current.trailerId} className="trailer-frame" src={`https://www.youtube-nocookie.com/embed/${current.trailerId}?autoplay=1&rel=0`} title={`${current.title} trailer`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/>:<><Art src={current.cover || current.poster} alt={`${current.title} artwork`} className="detail-cover"/><div className="detail-cover-shade"/>{current.trailerId?<button className="large-play" onClick={()=>setPlayer(true)} aria-label={`Play ${current.title} trailer`}><Play fill="currentColor" size={27}/><span>Play trailer</span></button>:<span className="no-trailer"><Film size={26}/>No trailer available</span>}</>}
          </div>
          <div className="dialog-body"><div className="detail-title-row"><div><span className="section-kicker">{current.format} · {current.year}</span><DialogTitle className="detail-title">{current.title}</DialogTitle>{current.originalTitle&&<p className="original-title">{current.originalTitle}</p>}</div>{current.score&&<div className="detail-score"><Star size={20} fill="currentColor"/><strong>{current.score}</strong><span>/ 10</span></div>}</div>
          <DialogDescription id="anime-description" className="sr-only">Details, trailer, episode information, and streaming options for {current.title}.</DialogDescription>
          {player&&<div className="player-help"><span>Trailer</span><a href={`https://www.youtube.com/watch?v=${current.trailerId}`} target="_blank" rel="noopener noreferrer">Watch on YouTube<ExternalLink size={13}/></a></div>}
          <button className="favorite-action" aria-pressed={favorites.some(a=>a.id===current.id)} onClick={()=>toggleFavorite(current)}><Heart size={16} fill={favorites.some(a=>a.id===current.id)?'currentColor':'none'}/>{favorites.some(a=>a.id===current.id)?'Saved to favorites':'Save to favorites'}</button>{saveError&&<p className="inline-error" role="alert">{saveError}</p>}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList variant="line" className="detail-tabs"><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="episodes">Episodes{current.episodes?` (${current.episodes})`:''}</TabsTrigger><TabsTrigger value="watch">Where to watch<ArrowUpRight size={14}/></TabsTrigger></TabsList>
            <TabsContent value="overview"><p className="full-synopsis">{current.synopsis || 'A synopsis is not available for this title yet.'}</p>{detail?.genres.length? <div className="detail-genres">{detail.genres.map(g=><span key={g}>{g}</span>)}</div>:null}<dl className="detail-facts"><div><dt>Format</dt><dd>{current.format}</dd></div><div><dt>Episodes</dt><dd>{current.episodes || 'Not announced'}</dd></div><div><dt>Episode length</dt><dd>{current.duration?`${current.duration} min`:'Not listed'}</dd></div><div><dt>Status</dt><dd>{current.status==='finished'?'Completed':current.status==='current'?'Airing':current.status==='unreleased'?'Upcoming':current.status || 'Not listed'}</dd></div></dl><button className="button primary" onClick={()=>setActiveTab('watch')}>Streaming options<ArrowUpRight size={16}/></button></TabsContent>
            <TabsContent value="episodes">{detailLoading?<div className="detail-loading"><LoaderCircle className="spinner" size={20}/>Loading episode information…</div>:detail?.episodes.length?<><p className="tab-note">Episode guide. Choose “Where to watch” to open a streaming service.</p><div className="episode-list">{detail.episodes.map(ep=><article key={ep.id} className="episode-row"><span className="episode-number">{String(ep.number).padStart(2,'0')}</span>{ep.thumbnail&&<Art src={ep.thumbnail} alt=""/>}<div><h4>{ep.title || `Episode ${ep.number}`}</h4>{ep.synopsis&&<p>{ep.synopsis}</p>}</div></article>)}</div>{episodeError&&<p className="inline-error" role="alert">{episodeError}</p>}{detail.hasMoreEpisodes&&<button className="button secondary more-episodes" disabled={episodeLoading} onClick={loadEpisodes}>{episodeLoading?<LoaderCircle size={16} className="spinner"/>:'Load more episodes'}</button>}</>:<div className="detail-empty"><Tv size={28}/><h3>{detail?.episodeError?'Episode guide is unavailable right now.':'No episode guide available yet.'}</h3><p>{current.episodes?`${current.episodes} episodes are listed for this anime.`:'New episode information will appear when the catalog is updated.'}</p>{detail?.episodeError&&<button className="button secondary" onClick={()=>openAnime(current)}>Try again</button>}</div>}</TabsContent>
            <TabsContent value="watch">{detailLoading?<div className="detail-loading"><LoaderCircle className="spinner" size={20}/>Finding streaming options…</div>:<>{detail?.links.length?<><p className="tab-note">Full episodes play on these services. A subscription or regional availability may apply.</p><div className="provider-list">{detail.links.map((l,i)=><a key={l.url+i} href={l.url} target="_blank" rel="noopener noreferrer"><span className="provider-symbol"><Play size={18} fill="currentColor"/></span><span><strong>{l.name}</strong><small>Open streaming service</small></span><ArrowUpRight size={20}/></a>)}</div></>:<div className="detail-empty"><Clapperboard size={30}/><h3>{detail?.linkError?'Streaming links could not be loaded.':'No streaming service is listed yet.'}</h3><p>Full episodes are not hosted on SinjiYi.</p>{detail?.linkError&&<button className="button secondary" onClick={()=>openAnime(current)}>Try again</button>}</div>}{current.trailerId&&<button className="button secondary" onClick={()=>{setPlayer(true);document.querySelector('.anime-dialog')?.scrollTo({top:0,behavior:'smooth'});}}><Play size={16}/>Watch trailer here</button>}<a className="kitsu-link" href={`https://kitsu.app/anime/${encodeURIComponent(current.slug || current.id)}`} target="_blank" rel="noopener noreferrer">View on Kitsu<ArrowUpRight size={14}/></a></>}</TabsContent>
          </Tabs>
          {detailError&&<p className="inline-error" role="alert">{detailError}<button onClick={()=>openAnime(current)}>Retry</button></p>}
          </div>
        </>}
      </DialogContent>
    </Dialog>
  </>;
}
