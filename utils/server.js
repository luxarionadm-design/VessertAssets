import http from 'http';
import path from 'path';
import os from 'os';
import { createReadStream, existsSync, statSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';

function escapeHtml( str ) {

	return str
		.replace( /&/g, '&amp;' )
		.replace( /</g, '&lt;' )
		.replace( />/g, '&gt;' )
		.replace( /"/g, '&quot;' );

}

const mimeTypes = {
	'.html': 'text/html',
	'.js': 'application/javascript',
	'.css': 'text/css',
	'.json': 'application/json',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.gif': 'image/gif',
	'.svg': 'image/svg+xml',
	'.mp3': 'audio/mpeg',
	'.mp4': 'video/mp4',
	'.webm': 'video/webm',
	'.ogv': 'video/ogg',
	'.ogg': 'audio/ogg',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2',
	'.ttf': 'font/ttf',
	'.glb': 'model/gltf-binary',
	'.gltf': 'model/gltf+json',
	'.hdr': 'application/octet-stream',
	'.exr': 'application/octet-stream',
	'.fbx': 'application/octet-stream',
	'.bin': 'application/octet-stream',
	'.cube': 'text/plain',
	'.wasm': 'application/wasm',
	'.ktx2': 'image/ktx2'
};

function createHandler( rootDirectory ) {

	return ( req, res ) => {

		const pathname = decodeURIComponent( req.url.split( '?' )[ 0 ] );
		let filePath = path.join( rootDirectory, pathname );

		// Prevent path traversal attacks
		if ( ! filePath.startsWith( rootDirectory ) ) {

			res.writeHead( 403 );
			res.end( 'Forbidden' );
			return;

		}

		// Handle directories
		if ( existsSync( filePath ) && statSync( filePath ).isDirectory() ) {

			const indexPath = path.join( filePath, 'index.html' );

			if ( existsSync( indexPath ) ) {

				filePath = indexPath;

			} else {

				// Show directory listing
				const rawFiles = readdirSync( filePath )
					.filter( f => ! f.startsWith( '.' ) )
					.map( f => {
						const fullP = path.join( filePath, f );
						const stat = statSync( fullP );
						return {
							name: f,
							isDir: stat.isDirectory(),
							size: stat.size,
							ext: path.extname( f ).toLowerCase()
						};
					} )
					.sort( ( a, b ) => {
						if ( a.isDir && ! b.isDir ) return - 1;
						if ( ! a.isDir && b.isDir ) return 1;
						return a.name.localeCompare( b.name );
					} );

				function formatBytes( bytes ) {
					if ( bytes === 0 ) return '0 B';
					const k = 1024;
					const sizes = [ 'B', 'KB', 'MB', 'GB' ];
					const i = Math.floor( Math.log( bytes ) / Math.log( k ) );
					return parseFloat( ( bytes / Math.pow( k, i ) ).toFixed( 1 ) ) + ' ' + sizes[ i ];
				}

				const base = pathname.endsWith( '/' ) ? pathname : pathname + '/';
				const pathParts = pathname.split( '/' ).filter( Boolean );
				let breadcrumbs = `<a href="/" class="crumb-link">root</a>`;
				let accPath = '';
				pathParts.forEach( ( part, idx ) => {
					accPath += '/' + part;
					if ( idx === pathParts.length - 1 && !pathname.endsWith( '/' ) ) {
						breadcrumbs += ` <span class="sep">/</span> <span class="crumb-curr">${escapeHtml( part )}</span>`;
					} else {
						breadcrumbs += ` <span class="sep">/</span> <a href="${escapeHtml( accPath )}/" class="crumb-link">${escapeHtml( part )}</a>`;
					}
				} );

				const itemsHtml = rawFiles.map( file => {
					const safeName = escapeHtml( file.name );
					const safeHref = escapeHtml( base + file.name + ( file.isDir ? '/' : '' ) );
					const icon = file.isDir ? '📁' : (
						['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'].includes( file.ext ) ? '🖼️' :
						['.mp4', '.webm'].includes( file.ext ) ? '🎬' :
						['.mp3', '.ogg'].includes( file.ext ) ? '🎵' :
						['.json', '.schema.json'].includes( file.ext ) ? '📋' :
						['.pdf'].includes( file.ext ) ? '📑' :
						['.glb', '.gltf'].includes( file.ext ) ? '🧊' :
						['.woff2', '.ttf'].includes( file.ext ) ? '🔤' : '📄'
					);
					const sizeText = file.isDir ? '—' : formatBytes( file.size );
					const badgeClass = file.isDir ? 'badge-dir' : 'badge-file';
					const badgeText = file.isDir ? 'DIR' : ( file.ext ? file.ext.replace( '.', '' ).toUpperCase() : 'FILE' );

					return `
					<tr class="file-row" data-name="${safeName.toLowerCase()}">
						<td class="col-name">
							<a href="${safeHref}" class="item-link">
								<span class="file-icon">${icon}</span>
								<span class="file-title">${safeName}</span>
							</a>
						</td>
						<td class="col-type"><span class="badge ${badgeClass}">${badgeText}</span></td>
						<td class="col-size">${sizeText}</td>
						<td class="col-act"><a href="${safeHref}" class="btn-action" target="${file.isDir ? '_self' : '_blank'}">${file.isDir ? 'Open' : 'View'}</a></td>
					</tr>`;
				} ).join( '\n' );

				const safePath = escapeHtml( pathname );
				const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>VessertID Explorer — ${safePath}</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
	font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif;
	background: #090D16;
	color: #F8FAFC;
	padding: 24px 20px;
	min-height: 100vh;
}
.container {
	max-width: 1080px;
	margin: 0 auto;
}
header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: 16px;
	padding-bottom: 20px;
	border-bottom: 1px solid #1E293B;
	margin-bottom: 20px;
}
.brand {
	display: flex;
	align-items: center;
	gap: 12px;
}
.logo-box {
	width: 40px;
	height: 40px;
	border-radius: 10px;
	background: linear-gradient(135deg, #6366F1, #06B6D4);
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 900;
	font-size: 20px;
	color: #FFF;
	box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}
.brand-name {
	font-size: 20px;
	font-weight: 900;
	letter-spacing: -0.5px;
	color: #F8FAFC;
}
.brand-tag {
	font-size: 11px;
	font-weight: 700;
	background: #1E293B;
	color: #38BDF8;
	padding: 3px 8px;
	border-radius: 6px;
	border: 1px solid #334155;
	margin-left: 6px;
}
.search-bar {
	position: relative;
	width: 100%;
	max-width: 320px;
}
.search-bar input {
	width: 100%;
	background: #1E293B;
	border: 1px solid #334155;
	border-radius: 8px;
	padding: 8px 12px 8px 36px;
	color: #FFF;
	font-size: 13px;
	outline: none;
	transition: border-color 0.2s;
}
.search-bar input:focus {
	border-color: #6366F1;
}
.search-icon {
	position: absolute;
	left: 12px;
	top: 50%;
	transform: translateY(-50%);
	font-size: 14px;
	color: #64748B;
}
.breadcrumbs {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 6px;
	font-size: 13px;
	color: #94A3B8;
	margin-bottom: 20px;
	background: #0F172A;
	padding: 10px 16px;
	border-radius: 8px;
	border: 1px solid #1E293B;
}
.crumb-link {
	color: #38BDF8;
	text-decoration: none;
	font-weight: 600;
}
.crumb-link:hover { text-decoration: underline; }
.crumb-curr {
	color: #F8FAFC;
	font-weight: 700;
}
.sep { color: #475569; }
.nav-back {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	font-size: 13px;
	color: #A5B4FC;
	text-decoration: none;
	font-weight: 600;
	margin-bottom: 16px;
	padding: 6px 12px;
	background: #1E1B4B;
	border: 1px solid #312E81;
	border-radius: 6px;
}
.nav-back:hover { background: #312E81; }
.table-card {
	background: #0F172A;
	border: 1px solid #1E293B;
	border-radius: 12px;
	overflow: hidden;
}
table {
	width: 100%;
	border-collapse: collapse;
	text-align: left;
}
thead th {
	background: #1E293B;
	padding: 12px 16px;
	font-size: 12px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	color: #94A3B8;
	border-bottom: 1px solid #334155;
}
tbody tr {
	border-bottom: 1px solid #1E293B;
	transition: background 0.15s;
}
tbody tr:hover {
	background: rgba(99, 102, 241, 0.08);
}
td {
	padding: 12px 16px;
	font-size: 13.5px;
	vertical-align: middle;
}
.col-name {
	width: 55%;
}
.item-link {
	display: flex;
	align-items: center;
	gap: 10px;
	color: #F8FAFC;
	text-decoration: none;
	font-weight: 500;
	word-break: break-word;
	overflow-wrap: anywhere;
}
.item-link:hover .file-title {
	color: #38BDF8;
}
.file-icon {
	font-size: 18px;
	flex-shrink: 0;
}
.file-title {
	line-height: 1.4;
	font-size: 14px;
}
.badge {
	display: inline-block;
	padding: 3px 8px;
	border-radius: 4px;
	font-size: 10.5px;
	font-weight: 800;
	letter-spacing: 0.5px;
}
.badge-dir {
	background: #1E1B4B;
	color: #A5B4FC;
	border: 1px solid #3730A3;
}
.badge-file {
	background: #1E293B;
	color: #94A3B8;
	border: 1px solid #334155;
}
.col-size {
	color: #94A3B8;
	font-family: ui-monospace, monospace;
	font-size: 12.5px;
}
.btn-action {
	display: inline-block;
	padding: 4px 10px;
	font-size: 12px;
	font-weight: 600;
	color: #38BDF8;
	background: #0369A1;
	background-opacity: 0.2;
	border: 1px solid #0284C7;
	border-radius: 6px;
	text-decoration: none;
	transition: all 0.15s;
}
.btn-action:hover {
	background: #0284C7;
	color: #FFF;
}
.footer-meta {
	margin-top: 24px;
	display: flex;
	justify-content: space-between;
	align-items: center;
	font-size: 12px;
	color: #64748B;
	flex-wrap: wrap;
	gap: 8px;
}
</style>
</head>
<body>
<div class="container">
	<header>
		<div class="brand">
			<div class="logo-box">V</div>
			<div>
				<span class="brand-name">VessertID</span>
				<span class="brand-tag">Asset Explorer</span>
			</div>
		</div>
		<div class="search-bar">
			<span class="search-icon">🔍</span>
			<input type="text" id="filterInput" placeholder="Filter files in directory..." autocomplete="off">
		</div>
	</header>

	<div class="breadcrumbs">
		${breadcrumbs}
	</div>

	${pathname !== '/' ? `<a href="../" class="nav-back">← Back to Parent Directory</a>` : ''}

	<div class="table-card">
		<table>
			<thead>
				<tr>
					<th>File / Folder Name</th>
					<th>Type</th>
					<th>Size</th>
					<th>Action</th>
				</tr>
			</thead>
			<tbody id="fileTable">
				${itemsHtml}
			</tbody>
		</table>
	</div>

	<div class="footer-meta">
		<span>VessertID 3D Spatial Platform • Production Asset Engine</span>
		<span id="itemCount">${rawFiles.length} items</span>
	</div>
</div>

<script>
const filterInput = document.getElementById('filterInput');
const rows = document.querySelectorAll('.file-row');
const countEl = document.getElementById('itemCount');

filterInput.addEventListener('input', (e) => {
	const query = e.target.value.toLowerCase().trim();
	let visible = 0;
	rows.forEach(r => {
		const name = r.getAttribute('data-name');
		if (!query || name.includes(query)) {
			r.style.display = '';
			visible++;
		} else {
			r.style.display = 'none';
		}
	});
	countEl.textContent = visible + ' items';
});
</script>
</body>
</html>`;

				res.writeHead( 200, { 'Content-Type': 'text/html' } );
				res.end( html );
				return;

			}

		}

		if ( ! existsSync( filePath ) ) {

			if ( existsSync( filePath + '.html' ) ) {

				filePath += '.html';

			} else {

				res.writeHead( 404 );
				res.end( 'File not found' );
				return;

			}

		}

		const ext = path.extname( filePath ).toLowerCase();
		const contentType = mimeTypes[ ext ] || 'application/octet-stream';
		const stat = statSync( filePath );
		const fileSize = stat.size;
		const range = req.headers.range;

		if ( range ) {

			const parts = range.replace( /bytes=/, '' ).split( '-' );
			const start = parseInt( parts[ 0 ], 10 );
			const end = parts[ 1 ] ? parseInt( parts[ 1 ], 10 ) : fileSize - 1;

			res.writeHead( 206, {
				'Content-Range': `bytes ${start}-${end}/${fileSize}`,
				'Accept-Ranges': 'bytes',
				'Content-Length': end - start + 1,
				'Content-Type': contentType
			} );

			createReadStream( filePath, { start, end } ).pipe( res );

		} else {

			res.writeHead( 200, {
				'Content-Length': fileSize,
				'Content-Type': contentType
			} );

			createReadStream( filePath ).pipe( res );

		}

	};

}

export function createServer( options = {} ) {

	const rootDirectory = options.root || path.resolve();
	const handler = createHandler( rootDirectory );

	return http.createServer( handler );

}

function tryListen( server, port, maxAttempts = 20 ) {

	return new Promise( ( resolve, reject ) => {

		let attempts = 0;

		const onError = ( err ) => {

			if ( err.code === 'EADDRINUSE' && attempts < maxAttempts ) {

				attempts ++;
				server.listen( port + attempts );

			} else {

				reject( err );

			}

		};

		const onListening = () => {

			server.off( 'error', onError );
			resolve( server.address().port );

		};

		server.once( 'error', onError );
		server.once( 'listening', onListening );
		server.listen( port );

	} );

}

// CLI mode
const isMain = process.argv[ 1 ] && path.resolve( process.argv[ 1 ] ) === path.resolve( fileURLToPath( import.meta.url ) );

if ( isMain ) {

	const args = process.argv.slice( 2 );
	const requestedPort = parseInt( args.find( ( _, i, arr ) => arr[ i - 1 ] === '-p' ) || process.env.PORT || '8080', 10 );
	const rootDirectory = path.resolve();

	const handler = createHandler( rootDirectory );
	const server = http.createServer( handler );

	const port = await tryListen( server, requestedPort );

	if ( port !== requestedPort ) {

		console.log( `\x1b[33mPort ${requestedPort} in use, using ${port} instead.\x1b[0m` );

	}

	console.log( `\x1b[32mServer running at http://localhost:${port}/\x1b[0m` );

	// Also ensure port 3000 is listening for AI Studio iFrame / container environment
	if ( port !== 3000 ) {

		try {

			const previewServer = http.createServer( handler );
			await tryListen( previewServer, 3000 );
			console.log( `\x1b[32mAI Studio preview running at http://localhost:3000/\x1b[0m` );

		} catch ( e ) {

			// Port 3000 already in use or unavailable

		}

	}

	// Show network addresses
	const interfaces = os.networkInterfaces();
	for ( const name of Object.keys( interfaces ) ) {

		for ( const net of interfaces[ name ] ) {

			if ( net.family === 'IPv4' && ! net.internal ) {

				console.log( `  http://${net.address}:${port}/` );

			}

		}

	}

	console.log( '\nPress Ctrl+C to stop.' );

	process.on( 'SIGINT', () => {

		console.log( '\nShutting down...' );
		server.close();
		process.exit( 0 );

	} );

}
