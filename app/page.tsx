import AnimeApp from './sinjiyi';
import {popular,featured,airing} from '@/lib/catalog';
export default function Page(){return <AnimeApp initial={popular} featured={featured} airing={airing}/>;}
