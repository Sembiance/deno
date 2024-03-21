export default function headOpen(data, {html, abc})
{
	return html`<head><title>${data.title} ${abc}</title>`;
}
