import {assertStrictEquals, assertEquals, path, base64Encode} from "std";
import * as csvUtil from "../csvUtil.js";
import {fileUtil} from "xutil";

Deno.test("parseCSV1", async () =>
{
	const raw = await fileUtil.readTextFile(path.join(import.meta.dirname, "files", "test1.csv"));
	assertStrictEquals(base64Encode(JSON.stringify(csvUtil.parse(raw))), "W3siaW5kZXgiOiJUZXh0VGFibGVfTmV0Q29kZXx2YWx1ZXxOZXRfQmFja19Db2RlXzQ5MTciLCJzdGF0dXMiOiIiLCJ6aCI6IlRoZSBwbGF5ZXIgaGFzIGxvb3NlIHF1b3RlIFwiIGhlcmUgbm90IGFwcGxpZWQifSx7ImluZGV4Ijoic3BfY2FyZF92MnxuYW1lfDgwMTAyMDExMiIsInN0YXR1cyI6IiIsInpoIjoiRXh0cmVtZWx5IFNjb3JuZnVsLGVtYmVkZGVkIGNvbW1hcywgLSBNaWdodCJ9LHsiaW5kZXgiOiJTNl9nYW1lcGxheV9ldmVudHxkZXNjfDQwMzIwMiIsInN0YXR1cyI6IiIsInpoIjoiT2J0YWluZWQ6IDxlIGlkPTYwMDAwMjA+Rmlyc3QgQmFuaydzIFNoYWNrbGVzPC9lPiJ9LHsiaW5kZXgiOiJucGN8bmFtZXwzMDA1MDEiLCJzdGF0dXMiOiIiLCJ6aCI6IlR3aXN0ZWQgXCJvbWdcIiBBZ2l0byJ9LHsiaW5kZXgiOiJtYXBfbW9kaWZpZXJ8ZGVzY3JpcHRpb258NzAwMDIyNzIiLCJzdGF0dXMiOiIiLCJ6aCI6IkJvc3NlcyBkcm9wICRQMSQgYWRkaXRpb25hbCBIZWxtZXQocykgd2l0aCAkUDIkIFQkUDMkIG9yIGhpZ2hlciBhZmZpeChlcykuIn0seyJpbmRleCI6ImhhbmRib29rfGRlc2NyaXB0aW9ufDEwMTcwIiwic3RhdHVzIjoiIiwiemgiOiJFdmFzaW9uIGlzIGEgZGVmZW5zaXZlIG1lY2hhbmljIGFnYWluc3QgSGl0IERhbWFnZS4gV2hlbiB0aGUgZGFtYWdlIG9mIGEgaGl0IGlzIGV2YWRlZCwgdGhlIGhpdCBkb2VzIG5vdCBkZWFsIGFueSBkYW1hZ2Ugb3IgdHJpZ2dlciBpdHMgaGl0IGVmZmVjdHMgYW5kIHN1YnNlcXVlbnQgZWZmZWN0cy4gVGhlIGNoYW5jZSBvZiBldmFkaW5nIGFuIGF0dGFjayBpcyBkZXRlcm1pbmVkIGJ5IHRoZSBhdHRhY2tlcidzIEFjY3VyYWN5IGFuZCB0aGUgdGFyZ2V0J3MgRXZhc2lvbiBSYXRlLlxcblxcbkhlcm9lcycgaGl0cyBhZ2FpbnN0IG1vbnN0ZXJzIHdpbGwgbm90IGJlIGV2YWRlZFxcbkV2YXNpb25cXG5DaGFyYWN0ZXJzIHN0YXJ0IHdpdGggMCBFdmFzaW9uIGJ5IGRlZmF1bHQsIHdoaWNoIGlzIGl0cyBsb3dlc3QgdmFsdWVcXG5FYWNoIGxldmVsIGluY3JlYXNlcyBFdmFzaW9uIGJ5IDNcXG5FYWNoIERleHRlcml0eSBpbmNyZWFzZXMgRXZhc2lvbiBieSAwLjAyJVxcblJlbGV2YW50IFN0YXRzXFxuRXZhc2lvblxcbkV2YXNpb24gJVxcbkFkZGl0aW9uYWwgRXZhc2lvbiAlXFxuR2VhciBFdmFzaW9uXFxuR2VhciBFdmFzaW9uICVcXG5cXG5FdmFzaW9uIFJhdGVcXG5FdmFzaW9uIFJhdGUgPTEtMS4xNXggYXR0YWNrZXIncyBBY2N1cmFjeS8oYXR0YWNrZXIncyBBY2N1cmFjeSArMC41eCBkZWZlbmRlcidzIEV2YXNpb25eMC43NSksIHdoaWNoIG1lYW5zIGl0IGlzIGRldGVybWluZWQgYnkgdGhlIGF0dGFja2VyJ3MgQWNjdXJhY3kgYW5kIHRoZSBkZWZlbmRlcidzIEV2YXNpb25cXG5UaGUgbWF4aW11bSBFdmFzaW9uIHJhdGUgaXMgNzUlLCBhbmQgdGhlIG1pbmltdW0gRXZhc2lvbiByYXRlIGlzIDAlXFxuRm9yIFNwZWxsIERhbWFnZSwgRXZhc2lvbiBkcm9wcyBieSBhZGRpdGlvbmFsIDQwJSBieSBkZWZhdWx0XFxuQ3VycmVudGx5LCB0aGUgaGlnaGVzdCBBY2N1cmFjeSBtb25zdGVycyBjYW4gaGF2ZSBpcyAxLDI0NyJ9LHsiaW5kZXgiOiJoeXBlcmxpbmt8bmFtZXw1MDAwMTMiLCJzdGF0dXMiOiIiLCJ6aCI6IldpbmR3YWxrIn0seyJpbmRleCI6InRhbGVfbnBjfGRlc3wxNzM1MzM4NzgiLCJzdGF0dXMiOiIiLCJ6aCI6Ik1heSB0aGUgSG9seSBTcGlyaXQgaGF2ZSBtZXJjeSBhbmQgc2F2ZSB1cyBhbGwuIn0seyJpbmRleCI6Iml0ZW1fYmFzZXxkZXNjcmlwdGlvbjJ8NDAwMjA0Iiwic3RhdHVzIjoiIiwiemgiOiJUaGlzIGJlYWNvbiBjYW4gYmUgdXNlZCBpbiB0aGUgU3RlZWwgRm9yZ2UgcGxhbmUgb2YgdGltZW1hcmsgMSBhbmQgdGltZW1hcmsgMi5cXG5cXG5CZWFjb25zIGFsbG93IHlvdSB0byBlbnRlciBOZXRoZXJyZWFsbSBhbmQgYXJlIGNvbnN1bWVkIHVwb24gb3BlbmluZyBhIE5ldGhlcnJlYWxtIHN0YWdlLlxcblxcblNvdXJjZXM6IGRyb3BwZWQgaW4gTmV0aGVycmVhbG0gYW5kIGV4Y2hhbmdlZCBmcm9tIHRyYWRlcnMifSx7ImluZGV4IjoidGFsZW50fG5hbWV8NjEwNDAzIiwic3RhdHVzIjoiIiwiemgiOiJNZWRpdW0gVGFsZW50In0seyJpbmRleCI6InNwX2FyZWFfbHZsX3YyfGJvc3NfbmFtZXwxMDE4Iiwic3RhdHVzIjoiIiwiemgiOiJDb2xkbmVzcyBUcmFjZXIgwrcgRnJlZXppbmcgVm9ydGV4In0seyJpbmRleCI6IlRleHRUYWJsZV9HYW1lRnVuY3x2YWx1ZXxGdW5jX0VuY2hhbnRfVGl0bGVOYW1lIiwic3RhdHVzIjoiIiwiemgiOiJFbmNoYW50In0seyJpbmRleCI6ImFmZml4X2NsYXNzfGRlc2NyaXB0aW9ufDEwMzAxMjAwMSIsInN0YXR1cyI6IiIsInpoIjoiQWZ0ZXIgZGVmZWF0aW5nIHRoZSBib3NzZXMgb2YgdGhlIENpdHkgb2YgQWV0ZXJuYSwgSGVyZXRpYyBDYW5kbGVsaWdodDogS2FuZGVsIHdpbGwgYXBwZWFyIHdpdGggPGUgaWQ9MTQwMj5Tb3VsIENhbmRsZSBGdXNpb248L2U+In0seyJpbmRleCI6ImFmZml4X2NsYXNzfGRlc2NyaXB0aW9ufDIwMDAwMDI4NyIsInN0YXR1cyI6IiIsInpoIjoiJCtQMSQlIGFkZGl0aW9uYWwgUGh5c2ljYWwgRGFtYWdlIHRha2VuIHdoaWxlIHRoZSBza2lsbCBsYXN0cyJ9LHsiaW5kZXgiOiJTNl9nYW1lcGxheV9yZWxpY3xuYW1lfDQwIiwic3RhdHVzIjoiIiwiemgiOiJBbnhpb3VzIEJsYWNrIEdvYXQncyBIb3JuIn0seyJpbmRleCI6Im1hbnVhbF9ydWxlX2Rlc3xkZXN8MjAwMTAxMDIxMSIsInN0YXR1cyI6IiIsInpoIjoiPFJpY2hUZXh0PkJyYW5kIERpdmluaXR5IFNsYXRlIHRvIGFkZCBhZGRpdGlvbmFsIEJyYW5kIFRhbGVudCBOb2RlcyB0byBhIERpdmluaXR5IFNsYXRlLjwvPiJ9LHsiaW5kZXgiOiJhZmZpeF9jbGFzc3xkZXNjcmlwdGlvbnwxMDEwMTA1MDgiLCJzdGF0dXMiOiIiLCJ6aCI6IjxlIGlkPTIwMDU4PkV1cGhvcmlhPC9lPjogYWRkaXRpb25hbCBkYW1hZ2UifSx7ImluZGV4IjoiYWZmaXhfY2xhc3N8ZGVzY3JpcHRpb258MTczMTAwMjIiLCJzdGF0dXMiOiIiLCJ6aCI6IjxlIGlkPTMxMDAyMj5CYXJyaWVyIG9mIFJhZGlhbmNlPC9lPiJ9LHsiaW5kZXgiOiJ0YWxlbnR8bmFtZXw1MDA3MDEiLCJzdGF0dXMiOiIiLCJ6aCI6IkxlZ2VuZGFyeSBNZWRpdW0gVGFsZW50In0seyJpbmRleCI6ImFjaGlldmVtZW50fHRpdGxlfDEwNzAwNTAiLCJzdGF0dXMiOiIiLCJ6aCI6IkJhZGxhbmRzIChDYXRleWUpIn0seyJpbmRleCI6Im1hbnVhbF9ydWxlX2Rlc3xkZXN8MTAwMTAxMjAyNiIsInN0YXR1cyI6IiIsInpoIjoiPFJpY2hUZXh0IElkPVwiMzEwM1wiPlVsdGltYXRlPC8+PFJpY2hUZXh0PlxcbkluIEZ1bGwgQmxvb20sIFNwaXJpdCBNYWdpIHVzZSB0aGVpciBVbHRpbWF0ZSB3aXRoIGV4dHJlbWVseSBoaWdoIHN0cmVuZ3RoIGFuZCBhIGNvb2xkb3duLjwvPiJ9LHsiaW5kZXgiOiJza2lsbF90YWd8ZGVzfDYwMDAyMTAiLCJzdGF0dXMiOiIiLCJ6aCI6IkRlZmVuc2l2ZSJ9LHsiaW5kZXgiOiJTNl9nYW1lcGxheV9uYXJydGl2ZXxjb250ZW50fDI1Iiwic3RhdHVzIjoiIiwiemgiOiJGb3JnZXQgZXZlcnl0aGluZy4gRm9yZ2V0IGV2ZXJ5dGhpbmcuIEZvcmdldCBldmVyeXRoaW5nLiBGb3JnZXQgZXZlcnl0aGluZy4gRm9yZ2V0IGV2ZXJ5dGhpbmcuIEZvcmdldCBldmVyeXRoaW5nLiJ9LHsiaW5kZXgiOiJzNV9nb29kZHJlYW1fYWZmaXh8ZGVzY3wzMDQwIiwic3RhdHVzIjoiIiwiemgiOiI8UmljaFRleHQ+QWRkcyAxIDwvPjxSaWNoVGV4dCBJZD1cIjMxNDNcIiBVZGw9XCIxXCIgSHlwZXJMaW5rVHlwZT1cIjFcIiBFdmVudElkPVwiNTAwMDAxMlwiPkN1YmUgQnViYmxlPC8+PFJpY2hUZXh0PiB0aGF0IGlzIDwvPjxSaWNoVGV4dCBJZD1cIjMxNDNcIiBVZGw9XCIxXCIgSHlwZXJMaW5rVHlwZT1cIjFcIiBFdmVudElkPVwiNTAwMDAwMlwiPkJsdWU8Lz48UmljaFRleHQ+IG9yIGJldHRlcjwvPiJ9LHsiaW5kZXgiOiJyZXNvdXJjZXxuYW1lfDM0NyIsInN0YXR1cyI6IiIsInpoIjoiUHJlZmFjZSBvZiBNb2Rlcm4gSGlzdG9yeSBvZiBJY2hpIn0seyJpbmRleCI6ImNvbmRfZXZlbnR8ZGVzfDUwNjAyNjciLCJzdGF0dXMiOiIiLCJ6aCI6IkNsZWFyIE5ldGhlcnJlYWxtIFtUaHVuZGVyIFdhc3Rlc10gMjAgdGltZXMgKCVkLyVkKSJ9LHsiaW5kZXgiOiJhZmZpeF9jbGFzc3xkZXNjcmlwdGlvbnw0NjE2MjMiLCJzdGF0dXMiOiIiLCJ6aCI6IkdhaW5zICRQMSQgcG9pbnRzIG9mIDxlIGlkPTYxND5SYWdlPC9lPiBpZiA8ZSBpZD02Mzg+U2VldGhpbmcgU3Bpcml0PC9lPiB1c2VzIGEgc2tpbGwgd2hpbGUgPGUgaWQ9NjE1PkJlcnNlcms8L2U+IGlzIG5vdCBhY3RpdmUifSx7ImluZGV4IjoidGFsZV9ucGN8ZGVzfDYyNzc4Mjk0NiIsInN0YXR1cyI6IiIsInpoIjoiT25lIGRheSwgYSBodW50cmVzcyBjYWxsZWQgSGFubmFoIHJldHJpZXZlZCB0aGUgbG9zdCBGaXJzdCBGbGFtZSBmcm9tIE1hZ251cy4gV2l0aCBpdCwgc2hlIGNyZWF0ZWQgYXJyb3dzIHRoYXQgc2hlIHVzZWQgdG8gc2hvb3QgZG93biB0aGUgZXZpbCBzdGFycyB0aGF0IGZpbGxlZCB0aGUgc2t5LCByZXR1cm5pbmcgbGlnaHQgdG8gdGhlIGxhbmQgb25jZSBtb3JlLiJ9LHsiaW5kZXgiOiJhY2hpZXZlbWVudHxkZXNjX2xpbnNoaXw0MTYwMDUwIiwic3RhdHVzIjoiIiwiemgiOiJMb2cgaW4gKCVkLyVkKSJ9LHsiaW5kZXgiOiJUZXh0VGFibGVfR2FtZUZ1bmN8dmFsdWV8RnVuY19JbkdhbWVEb3dubG9hZF9Eb3dubG9hZFN1Y2Nlc3MiLCJzdGF0dXMiOiIiLCJ6aCI6IkRvd25sb2FkIGNvbXBsZXRlIn0seyJpbmRleCI6IlRleHRUYWJsZV9HYW1lRnVuY3x2YWx1ZXxGdW5jX0Ryb3BGaWx0ZXJfRHJvcEJveFRleHREZWNvIiwic3RhdHVzIjoiIiwiemgiOiJQcmVmaXhlcyBhbmQgU3VmZml4ZXMifSx7ImluZGV4IjoiYWZmaXhfY2xhc3N8ZGVzY3JpcHRpb258NTQzODQiLCJzdGF0dXMiOiIiLCJ6aCI6IkFkZHMgQmFzZSBQaHlzaWNhbCBEYW1hZ2UgZXF1YWwgdG8gJFAxJCUgb2YgdGhlIHN1bSBvZiB0aGUgQ2hhcmFjdGVyJ3MgTWF4IExpZmUgYW5kIEVuZXJneSBTaGllbGQgdG8gdGhlIFNlbGYtRGVzdHJ1Y3Rpb24gY2F1c2VkIGJ5IDxlIGlkPTYzOT5TZWxmLURlc3RydWN0IFByb3RvY29sPC9lPiJ9LHsiaW5kZXgiOiJhZmZpeF9jbGFzc3xkZXNjcmlwdGlvbnwxNTMiLCJzdGF0dXMiOiIiLCJ6aCI6IklmIGEgdHlwZSBvZiBFbGVtZW50YWwgRGFtYWdlIHdhcyBkZWFsdCByZWNlbnRseSwgJCtQMSQlIGFkZGl0aW9uYWwgZGFtYWdlIGZvciAyIG90aGVyIHR5cGVzIG9mIEVsZW1lbnRhbCBEYW1hZ2UifSx7ImluZGV4IjoiUzZfZ2FtZXBsYXlfcmVsaWN8ZGVzY3w1MCIsInN0YXR1cyI6IiIsInpoIjoiRmlsdGggRWF0ZXJzIGNhbid0IHJlYWQsIGJ1dCB0aGV5IG1pZ2h0IGJlIGFibGUgdG8gdW5kZXJzdGFuZCBzaW1wbGUgbWFwcy5cXG5JdCdzIG9rYXkgaWYgeW91IGdldCBsb3N0LiBKdXN0IGhpcmUgYW5vdGhlciBvbmUuIn0seyJpbmRleCI6ImFmZml4X2NsYXNzfGRlc2NyaXB0aW9ufDU2NTQ0NyIsInN0YXR1cyI6IiIsInpoIjoiJCtQMSQlIDxlIGlkPTUwMj5NYXggRXJvc2lvbiBSZXNpc3RhbmNlPC9lPiwgJCtQMiQlIEVyb3Npb24gUmVzaXN0YW5jZSJ9LHsiaW5kZXgiOiJhZmZpeF9jbGFzc3xkZXNjcmlwdGlvbnwxNzcyNTIiLCJzdGF0dXMiOiIiLCJ6aCI6IiQrUDEkJSBXYXJjcnkgQ2FzdCBTcGVlZCJ9LHsiaW5kZXgiOiJTNl9nYW1lcGxheV9idWZmfGRlc2N8MzE1MSIsInN0YXR1cyI6IiIsInpoIjoiUHJldmlldyAxIGFkZGl0aW9uYWwgcmFuZG9tIENlbGwgd2hlbiByZXZlYWxpbmcgYSBwcmV2aWV3ZWQgQ2VsbCJ9LHsiaW5kZXgiOiJTNl9nYW1lcGxheV9lbmNvdW50ZXJ8c2VsZWN0aW9uRGVzYzJfMXwxMCIsInN0YXR1cyI6IiIsInpoIjoiQnV5IHR3byBiYWdzIn0seyJpbmRleCI6InRhbGVudHxuYW1lfDEzMDQwMyIsInN0YXR1cyI6IiIsInpoIjoiTWVkaXVtIFRhbGVudCJ9LHsiaW5kZXgiOiJ0YXNrX2Zvcm1hbHxzdWJ0aXRsZV9ndWlkZXwxMTU2MDEyIiwic3RhdHVzIjoiIiwiemgiOiJIZWFkIHRvIEF3YWtlbmVkIFNocmluZSJ9LHsiaW5kZXgiOiJtYXBfcG9ydGFsfG5hbWV8MTExMTM4MDEiLCJzdGF0dXMiOiIiLCJ6aCI6IlZvbGNhbm8gb2YgRGVhdGgifSx7ImluZGV4IjoiaXRlbV9iYXNlfG5hbWV8OTAwMTM1MCIsInN0YXR1cyI6IiIsInpoIjoiU3Bpcml0d29vZCBXYW5kIn0seyJpbmRleCI6Iml0ZW1fZ29sZHxkZXNjcmlwdGlvbnwxMTIzMTMiLCJzdGF0dXMiOiIiLCJ6aCI6Ik9ubHkgYSBtYWQgb25lIGhhcyBzdWNoIGEgYmVhdXRpZnVsIGRyZWFtLiJ9LHsiaW5kZXgiOiJ0YXNrX2Zvcm1hbHx0aXRsZXwxMTEyMDA3Iiwic3RhdHVzIjoiIiwiemgiOiJUd2lsaWdodCBvZiB0aGUgUGFzdCJ9LHsiaW5kZXgiOiJhdHRyaWJ1dGVzX3Nob3d8bmFtZXwxMTAxNTAiLCJzdGF0dXMiOiIiLCJ6aCI6Ik1pbmltdW0gUGh5c2ljYWwgdG8gTGlnaHRuaW5nIHRvIENvbGQgLSBNaW4gMTEwMTUwIn0seyJpbmRleCI6Im1hbnVhbF9ydWxlfG5hbWV8MzAwMjAyMDIiLCJzdGF0dXMiOiIiLCJ6aCI6IkNvbmZ1c2lvbiBDYXJkIn0seyJpbmRleCI6Iml0ZW1fYmFzZXxkZXNjcmlwdGlvbjF8NjEzOSIsInN0YXR1cyI6IiIsInpoIjoiRmx1b3Jlc2NlbnQgTWVtb3J5IFNoYXJkcyJ9LHsiaW5kZXgiOiJ0YWxlbnR8ZGVzX3R5cGUyfDMwMDAyMiIsInN0YXR1cyI6IiIsInpoIjoiPGUgaWQ9MzAwMDIyPkJ1cm5pbmcgVG91Y2g8L2U+In0seyJpbmRleCI6ImZ1bmN0aW9uX2Rlc3xkZXN8NSIsInN0YXR1cyI6IiIsInpoIjoiSW1tZWRpYXRlbHkgcmVjZWl2ZSAzMDAgUHJpbW9jcnlzdC5cXG5PYnRhaW4gNjAgSmFnZ2VkIFByaW1vY3J5c3QgZXZlcnkgZGF5LiJ9LHsiaW5kZXgiOiJhZmZpeF9jbGFzc3xkZXNjcmlwdGlvbnwxNDEyOCIsInN0YXR1cyI6IiIsInpoIjoiJCtQMSQlIFNlbnRyeSBTa2lsbCBjYXN0IGZyZXF1ZW5jeSJ9LHsiaW5kZXgiOiJucGN8bmFtZXwyNDAwMTAwIiwic3RhdHVzIjoiIiwiemgiOiJGb3VyIFJlYWxtcyJ9LHsiaW5kZXgiOiJ0YWxlX25wY3xkZXN8ODYwNjgyNTUiLCJzdGF0dXMiOiIiLCJ6aCI6IkJ1dCBpdCBpcyBleHRyZW1lbHkgY3JhZnR5LiBXZSBjaGFzZWQgaXQgZG93biBmb3IgYSBsb25nIHRpbWUgYmVmb3JlIHdlIG1hbmFnZWQgdG8gY2FwdHVyZSBpdCBoZXJlLiJ9LHsiaW5kZXgiOiJ0YXNrX2Zvcm1hbHxzdWJ0aXRsZXwxMTQ5MDA1Iiwic3RhdHVzIjoiIiwiemgiOiJFbmNoYW50IHRoZSBjcmFmdGVkIGdlYXIgMSB0aW1lIn0seyJpbmRleCI6Imh5cGVybGlua3xuYW1lfDYwMDAwMDUiLCJzdGF0dXMiOiIiLCJ6aCI6IkV4cGxvcmVyJ3MgR2xhc3NlcyJ9LHsiaW5kZXgiOiJpdGVtX2Jhc2V8ZGVzY3JpcHRpb24xfDQwNDMwNCIsInN0YXR1cyI6IiIsInpoIjoiVGh1bmRlciBXYXN0ZXMgUGxhbmUgfCBSYW5rIDUgQmVhY29uIn0seyJpbmRleCI6IlRleHRUYWJsZV9HYW1lRnVuY3x2YWx1ZXxGdW5jX215c3RpY0Jvc3NfM182XzMwNTEiLCJzdGF0dXMiOiIiLCJ6aCI6IkRlZmVhdCBUcmF2ZWxlcnMgYjEgdGltZXMgKFRpbWVtYXJrIDcpIn0seyJpbmRleCI6Im5wY3xuYW1lfDEwMjAwMjciLCJzdGF0dXMiOiIiLCJ6aCI6IlRyb2cgU2VudHJ5In0seyJpbmRleCI6ImNvbmRfZXZlbnR8ZGVzfDUwNjAzMjEiLCJzdGF0dXMiOiIiLCJ6aCI6IlVzZSAyMCBSYW5rIDUgQmVhY29ucyJ9LHsiaW5kZXgiOiJpdGVtX2dvbGR8bmFtZXwxMTIyMTMiLCJzdGF0dXMiOiIiLCJ6aCI6IlNpcmVuIEZhY2VndWFyZCJ9LHsiaW5kZXgiOiJoeXBlcmxpbmt8bmFtZXwzMjAwMTEiLCJzdGF0dXMiOiIiLCJ6aCI6IkZyb3N0Yml0dGVuIn0seyJpbmRleCI6Iml0ZW1fZ29sZHxwcmVmaXgxX2Rlc3wyMDA1Iiwic3RhdHVzIjoiIiwiemgiOiI8UmFuZG9tIEFybW9yLCBFbmVyZ3kgU2hpZWxkLCBFdmFkZSBhZmZpeD4ifSx7ImluZGV4IjoibnBjfG5hbWV8MjE5MDA3MyIsInN0YXR1cyI6IiIsInpoIjoiUm9hZCBvZiB0aGUgTW9vbiBUcmVhc3VyZSBDaGVzdCJ9LHsiaW5kZXgiOiJTNl9nYW1lcGxheV90YWxlbnR8ZGVzY19mdW5jfDgiLCJzdGF0dXMiOiIiLCJ6aCI6IjxSaWNoVGV4dD5RdWFudGl0eSBvZiBPbGQgU3R1ZmYgc29sZCBieSB0aGUgTWlzdHZpbGxlIFRyYWRlciA8Lz48UmljaFRleHQgSWQ9XCIzNTEzXCI+KyVzPC8+In0seyJpbmRleCI6Iml0ZW1fYmFzZXxkZXNjcmlwdGlvbjF8NzQzNiIsInN0YXR1cyI6IiIsInpoIjoiU2tpbGwifSx7ImluZGV4IjoiaXRlbV9iYXNlfGRlc2NyaXB0aW9uMnw0OCIsInN0YXR1cyI6IiIsInpoIjoiT25lLUhhbmRlZCJ9LHsiaW5kZXgiOiJpdGVtX2dvbGR8ZGVzY3JpcHRpb258MTEwNzA0Iiwic3RhdHVzIjoiIiwiemgiOiJJdCB3YXMgZm9yIHBpZXJjaW5nIHRocm91Z2ggeW91IGZyb20gdGhlIGJlZ2lubmluZy4ifSx7ImluZGV4IjoiY29sbGVjdGlvbl90eXBlMXxuYW1lfDEiLCJzdGF0dXMiOiIiLCJ6aCI6IlBhZ2VzIn0seyJpbmRleCI6ImFmZml4X2NsYXNzfGRlc2NyaXB0aW9ufDEwMzQ5MDAwMSIsInN0YXR1cyI6IiIsInpoIjoiJFAxJCUgY2hhbmNlIHRvIHNwcmVhZCA8ZSBpZD03MTA+SWduaXRlPC9lPiB0byA8ZSBpZD0xMDI+TmVhcmJ5PC9lPiBlbmVtaWVzIHVwb24gaW5mbGljdGluZyA8ZSBpZD03MTA+SWduaXRlPC9lPiJ9LHsiaW5kZXgiOiJ0YXNrX2Zvcm1hbHxzdWJ0aXRsZV9ndWlkZXwxMDg5MDAzIiwic3RhdHVzIjoiIiwiemgiOiJIZWFkIHRvIFN0YXIncyBGYWxsIn0seyJpbmRleCI6Im5wY3xuYW1lfDEzMTAxMjYiLCJzdGF0dXMiOiIiLCJ6aCI6IkdvYmxpbiBEYXJ0IEJsb3dlciJ9LHsiaW5kZXgiOiJhZmZpeF9jbGFzc3xkZXNjcmlwdGlvbnw5MzAwNyIsInN0YXR1cyI6IiIsInpoIjoiPGUgaWQ9MjMwMDc+QnkgTXkgU2lkZSAtIEljZS1GaXJlIEZ1c2lvbjwvZT4ifSx7ImluZGV4Ijoic2VydmFudHxkZXNfZWZmZWN0fDExMTEwIiwic3RhdHVzIjoiIiwiemgiOiJJbmNyZWFzZXMgRHJvcCBRdWFudGl0eSJ9LHsiaW5kZXgiOiJzZXJ2YW50fGRlc19lZmZlY3R8ODUzMCIsInN0YXR1cyI6IiIsInpoIjoiSW5jcmVhc2VzIGRhbWFnZSwgd2Vha2VucyB0aGUgQ3Vyc2VkIGVuZW1pZXMsIGFuZCBoYXMgYSBDdXJzZSBlZmZlY3QifSx7ImluZGV4IjoiVGV4dFRhYmxlX05ldENvZGV8dmFsdWV8TmV0X0JhY2tfQ29kZV85Iiwic3RhdHVzIjoiIiwiemgiOiJTYXZpbmcgaGVybyBkYXRhIn0seyJpbmRleCI6ImFmZml4X2NsYXNzfGRlc2NyaXB0aW9ufDE3MTAwMDIxIiwic3RhdHVzIjoiIiwiemgiOiI8ZSBpZD0xMDAwMjE+R3JlYXQgU3RyZW5ndGg8L2U+In0seyJpbmRleCI6ImxldmVsfG5hbWV8NDU0MiIsInN0YXR1cyI6IiIsInpoIjoiU2hyaW5lIG9mIEFnb255In0seyJpbmRleCI6ImxldmVsfG5hbWV8NDAwMzA0Iiwic3RhdHVzIjoiIiwiemgiOiJTa2lydGhlbSBvZiBHb2RkZXNzIn0seyJpbmRleCI6InNraWxsX2Rlc3xkZXNfY29uZmlnfDUwMDIwMCIsInN0YXR1cyI6IiIsInpoIjoiQWN0aXZhdGVzIHRoZSBBdXJhLCB5b3UgYW5kIGFsbGllcyB3aXRoaW4gYSBjZXJ0YWluIGFyZWEgZ2FpbiB0aGUgZm9sbG93aW5nIGJ1ZmY6XFxuPHA+eyVzOjF9JSU8L3A+IGFkZGl0aW9uYWwgUGh5c2ljYWwgRGFtYWdlLiJ9LHsiaW5kZXgiOiJhZmZpeF9jbGFzc3xkZXNjcmlwdGlvbnwxMDMzMzYwMjEiLCJzdGF0dXMiOiIiLCJ6aCI6IkluIFRyaWFsOiBHb2Qgb2YgTWFjaGluZXMsIHRoZSBpbnRlcnZhbCBiZXR3ZWVuIGVuZW15IGF0dGFjayB3YXZlcyBpcyByZWR1Y2VkIHRvICRQMSQgcyJ9LHsiaW5kZXgiOiJhZmZpeF9jbGFzc3xkZXNjcmlwdGlvbnwyMDAwMDAwOTIiLCJzdGF0dXMiOiIiLCJ6aCI6IlVwb24gcmVjZWl2aW5nIDxlIGlkPTEwNT5GYXRhbCBEYW1hZ2U8L2U+LCBsb3NlcyB0aGUgPGUgaWQ9NjI2PlNwYWNldGltZSBJbGx1c2lvbjwvZT4gYW5kIHVzZXMgdGhlIHBvd2VyIG9mIFNwYWNldGltZSB0byBiZWNvbWUgaW1tdW5lIHRvIHRoZSBkYW1hZ2UsIDxlIGlkPTcwMz5Lbm9jayBCYWNrPC9lPiA8ZSBpZD0xMDI+bmVhcmJ5PC9lPiBlbmVtaWVzLCBhbmQgcmVzdG9yZSAkUDEkJSBvZiBNaXNzaW5nIExpZmUgYW5kIEVuZXJneSBTaGllbGQuIEludGVydmFsOiAkUDIkcyJ9LHsiaW5kZXgiOiJucGN8bmFtZXwxMTIwMDUyIiwic3RhdHVzIjoiIiwiemgiOiJUd2lzdGVkIEFnaXRvIn0seyJpbmRleCI6ImFmZml4X2NsYXNzfGRlc2NyaXB0aW9ufDIwNjYxMSIsInN0YXR1cyI6IiIsInpoIjoiJCtQMSQlIGFkZGl0aW9uYWwgZGFtYWdlIGZvciBldmVyeSA1JSBjdXJyZW50IE1hbmEifSx7ImluZGV4IjoiYWZmaXhfY2xhc3N8ZGVzY3JpcHRpb258MzkyMTk0Iiwic3RhdHVzIjoiIiwiemgiOiJXaGlsZSB0aGUgc2tpbGwgbGFzdHMsIGRlYWxzIGhpZ2hlciBkYW1hZ2UgdG8gcmFyZXIgZW5lbWllcywgdXAgdG8gJCtQMSQlIGFkZGl0aW9uYWwgZGFtYWdlIn0seyJpbmRleCI6InNwX2NhcmRfdjJ8bmFtZXw5MDEwMjAyMSIsInN0YXR1cyI6IiIsInpoIjoiUGVyc2lzdGVudCAtIE1pZ2h0In0seyJpbmRleCI6Iml0ZW1fYmFzZXxkZXNjcmlwdGlvbjJ8MzQwMyIsInN0YXR1cyI6IiIsInpoIjoiSGFuZHMifSx7ImluZGV4IjoibWFpbl9zdG9yeXxkZXNjcmliZXwyMTMwMDEiLCJzdGF0dXMiOiIiLCJ6aCI6IlRoaXMgbXlzdGVyaW91cywgaGVhdmlseSBndWFyZGVkIG1vbmFzdGVyeSBpcyBhIGZvcmJpZGRlbiBwbGFjZSBvZiB0aGUgQ2h1cmNoIHRoYXQgY2Fubm90IGV2ZW4gYmUgbWVudGlvbmVkLiBIb3dldmVyLCBpdCBoaWRlcyB0aGUgc2VjcmV0IG9mIHRoZSBcIlNlY29uZCBDaHVyY2guXCIifSx7ImluZGV4IjoiVGV4dFRhYmxlX05ldENvZGV8dmFsdWV8TmV0X0JhY2tfQ29kZV85MDEiLCJzdGF0dXMiOiIiLCJ6aCI6Ikhlcm8gVHJhaXQgZG9lcyBubyBhcHBseSB0byB0aGUgY3VycmVudCBoZXJvIn0seyJpbmRleCI6Imd1aWRlfGRlc19wY3wxMTAwIiwic3RhdHVzIjoiIiwiemgiOiJPcGVuIHRoZSBtZW51In0seyJpbmRleCI6InRhc2tfZm9ybWFsfHN1YnRpdGxlX2d1aWRlfDExMjEwMDMiLCJzdGF0dXMiOiIiLCJ6aCI6IkhlYWQgdG8gU3BhcmsgSGFsbCJ9LHsiaW5kZXgiOiJtYWluX3N0b3J5fG5hbWV8NDAyMDUwIiwic3RhdHVzIjoiIiwiemgiOiJHcmlmZmluJ3MgTmVzdCJ9LHsiaW5kZXgiOiJzcF9jYXJkX2NsYXNzX3YyfG5hbWV8NCIsInN0YXR1cyI6IiIsInpoIjoiTWVtb3J5IEZyYWdtZW50In0seyJpbmRleCI6ImFjaGlldmVtZW50fGRlc2NfbGluc2hpfDUwNjAyMzQiLCJzdGF0dXMiOiIiLCJ6aCI6IkNsZWFyIDIwIEdsYWNpYWwgQWJ5c3Mgc3RhZ2VzICglZC8lZCkifSx7ImluZGV4Ijoid2VhcG9ufGdyb3VwX25hbWV8NCIsInN0YXR1cyI6IiIsInpoIjoiT25lLUhhbmRlZCBTd29yZC9IYW1tZXIvQXhlL0RhZ2dlciJ9LHsiaW5kZXgiOiJtb25leXxkZXNjcmlwdGlvbnw2MzEwIiwic3RhdHVzIjoiIiwiemgiOiJIYXBweSBDaG9ua3kncyB1cGdyYWRlIG1hdGVyaWFsLiJ9LHsiaW5kZXgiOiJsZXZlbHxuYW1lfDUwMDQiLCJzdGF0dXMiOiIiLCJ6aCI6IlN3aXJsaW5nIE1pbmVzIChTY29yY2hpbmcpIn0seyJpbmRleCI6InNwX2NhcmRfdjJ8bmFtZXwxMDAyMDA4MyIsInN0YXR1cyI6IiIsInpoIjoiIn0seyJpbmRleCI6InJlc291cmNlfG5hbWV8NDUxIiwic3RhdHVzIjoiIiwiemgiOiJOaW5hIHRoZSBIdW50ZXIifSx7ImluZGV4Ijoic2tpbGxfZGVzfGRlc19jb25maWd8MTAwMDI2MTAwIiwic3RhdHVzIjoiIiwiemgiOiJTdXBwb3J0cyBBdXJhIFNraWxscy5cXG57JXM6MX0ifSx7ImluZGV4IjoiVGV4dFRhYmxlX0dhbWVGdW5jfHZhbHVlfEZ1bmNfTXlzdGVyeV9SZXdhcmRGaXJzdFBhc3MiLCJzdGF0dXMiOiIiLCJ6aCI6IkZpcnN0IENsZWFyIFJld2FyZCJ9LHsiaW5kZXgiOiJmdW5jdGlvbnxkZXN8MTQ5Iiwic3RhdHVzIjoiIiwiemgiOiIxIn1d");

	assertStrictEquals(base64Encode(JSON.stringify(csvUtil.parse(raw, {colidMapper : v => v.toProperCase()}))), "W3siSW5kZXgiOiJUZXh0VGFibGVfTmV0Q29kZXx2YWx1ZXxOZXRfQmFja19Db2RlXzQ5MTciLCJTdGF0dXMiOiIiLCJaaCI6IlRoZSBwbGF5ZXIgaGFzIGxvb3NlIHF1b3RlIFwiIGhlcmUgbm90IGFwcGxpZWQifSx7IkluZGV4Ijoic3BfY2FyZF92MnxuYW1lfDgwMTAyMDExMiIsIlN0YXR1cyI6IiIsIlpoIjoiRXh0cmVtZWx5IFNjb3JuZnVsLGVtYmVkZGVkIGNvbW1hcywgLSBNaWdodCJ9LHsiSW5kZXgiOiJTNl9nYW1lcGxheV9ldmVudHxkZXNjfDQwMzIwMiIsIlN0YXR1cyI6IiIsIlpoIjoiT2J0YWluZWQ6IDxlIGlkPTYwMDAwMjA+Rmlyc3QgQmFuaydzIFNoYWNrbGVzPC9lPiJ9LHsiSW5kZXgiOiJucGN8bmFtZXwzMDA1MDEiLCJTdGF0dXMiOiIiLCJaaCI6IlR3aXN0ZWQgXCJvbWdcIiBBZ2l0byJ9LHsiSW5kZXgiOiJtYXBfbW9kaWZpZXJ8ZGVzY3JpcHRpb258NzAwMDIyNzIiLCJTdGF0dXMiOiIiLCJaaCI6IkJvc3NlcyBkcm9wICRQMSQgYWRkaXRpb25hbCBIZWxtZXQocykgd2l0aCAkUDIkIFQkUDMkIG9yIGhpZ2hlciBhZmZpeChlcykuIn0seyJJbmRleCI6ImhhbmRib29rfGRlc2NyaXB0aW9ufDEwMTcwIiwiU3RhdHVzIjoiIiwiWmgiOiJFdmFzaW9uIGlzIGEgZGVmZW5zaXZlIG1lY2hhbmljIGFnYWluc3QgSGl0IERhbWFnZS4gV2hlbiB0aGUgZGFtYWdlIG9mIGEgaGl0IGlzIGV2YWRlZCwgdGhlIGhpdCBkb2VzIG5vdCBkZWFsIGFueSBkYW1hZ2Ugb3IgdHJpZ2dlciBpdHMgaGl0IGVmZmVjdHMgYW5kIHN1YnNlcXVlbnQgZWZmZWN0cy4gVGhlIGNoYW5jZSBvZiBldmFkaW5nIGFuIGF0dGFjayBpcyBkZXRlcm1pbmVkIGJ5IHRoZSBhdHRhY2tlcidzIEFjY3VyYWN5IGFuZCB0aGUgdGFyZ2V0J3MgRXZhc2lvbiBSYXRlLlxcblxcbkhlcm9lcycgaGl0cyBhZ2FpbnN0IG1vbnN0ZXJzIHdpbGwgbm90IGJlIGV2YWRlZFxcbkV2YXNpb25cXG5DaGFyYWN0ZXJzIHN0YXJ0IHdpdGggMCBFdmFzaW9uIGJ5IGRlZmF1bHQsIHdoaWNoIGlzIGl0cyBsb3dlc3QgdmFsdWVcXG5FYWNoIGxldmVsIGluY3JlYXNlcyBFdmFzaW9uIGJ5IDNcXG5FYWNoIERleHRlcml0eSBpbmNyZWFzZXMgRXZhc2lvbiBieSAwLjAyJVxcblJlbGV2YW50IFN0YXRzXFxuRXZhc2lvblxcbkV2YXNpb24gJVxcbkFkZGl0aW9uYWwgRXZhc2lvbiAlXFxuR2VhciBFdmFzaW9uXFxuR2VhciBFdmFzaW9uICVcXG5cXG5FdmFzaW9uIFJhdGVcXG5FdmFzaW9uIFJhdGUgPTEtMS4xNXggYXR0YWNrZXIncyBBY2N1cmFjeS8oYXR0YWNrZXIncyBBY2N1cmFjeSArMC41eCBkZWZlbmRlcidzIEV2YXNpb25eMC43NSksIHdoaWNoIG1lYW5zIGl0IGlzIGRldGVybWluZWQgYnkgdGhlIGF0dGFja2VyJ3MgQWNjdXJhY3kgYW5kIHRoZSBkZWZlbmRlcidzIEV2YXNpb25cXG5UaGUgbWF4aW11bSBFdmFzaW9uIHJhdGUgaXMgNzUlLCBhbmQgdGhlIG1pbmltdW0gRXZhc2lvbiByYXRlIGlzIDAlXFxuRm9yIFNwZWxsIERhbWFnZSwgRXZhc2lvbiBkcm9wcyBieSBhZGRpdGlvbmFsIDQwJSBieSBkZWZhdWx0XFxuQ3VycmVudGx5LCB0aGUgaGlnaGVzdCBBY2N1cmFjeSBtb25zdGVycyBjYW4gaGF2ZSBpcyAxLDI0NyJ9LHsiSW5kZXgiOiJoeXBlcmxpbmt8bmFtZXw1MDAwMTMiLCJTdGF0dXMiOiIiLCJaaCI6IldpbmR3YWxrIn0seyJJbmRleCI6InRhbGVfbnBjfGRlc3wxNzM1MzM4NzgiLCJTdGF0dXMiOiIiLCJaaCI6Ik1heSB0aGUgSG9seSBTcGlyaXQgaGF2ZSBtZXJjeSBhbmQgc2F2ZSB1cyBhbGwuIn0seyJJbmRleCI6Iml0ZW1fYmFzZXxkZXNjcmlwdGlvbjJ8NDAwMjA0IiwiU3RhdHVzIjoiIiwiWmgiOiJUaGlzIGJlYWNvbiBjYW4gYmUgdXNlZCBpbiB0aGUgU3RlZWwgRm9yZ2UgcGxhbmUgb2YgdGltZW1hcmsgMSBhbmQgdGltZW1hcmsgMi5cXG5cXG5CZWFjb25zIGFsbG93IHlvdSB0byBlbnRlciBOZXRoZXJyZWFsbSBhbmQgYXJlIGNvbnN1bWVkIHVwb24gb3BlbmluZyBhIE5ldGhlcnJlYWxtIHN0YWdlLlxcblxcblNvdXJjZXM6IGRyb3BwZWQgaW4gTmV0aGVycmVhbG0gYW5kIGV4Y2hhbmdlZCBmcm9tIHRyYWRlcnMifSx7IkluZGV4IjoidGFsZW50fG5hbWV8NjEwNDAzIiwiU3RhdHVzIjoiIiwiWmgiOiJNZWRpdW0gVGFsZW50In0seyJJbmRleCI6InNwX2FyZWFfbHZsX3YyfGJvc3NfbmFtZXwxMDE4IiwiU3RhdHVzIjoiIiwiWmgiOiJDb2xkbmVzcyBUcmFjZXIgwrcgRnJlZXppbmcgVm9ydGV4In0seyJJbmRleCI6IlRleHRUYWJsZV9HYW1lRnVuY3x2YWx1ZXxGdW5jX0VuY2hhbnRfVGl0bGVOYW1lIiwiU3RhdHVzIjoiIiwiWmgiOiJFbmNoYW50In0seyJJbmRleCI6ImFmZml4X2NsYXNzfGRlc2NyaXB0aW9ufDEwMzAxMjAwMSIsIlN0YXR1cyI6IiIsIlpoIjoiQWZ0ZXIgZGVmZWF0aW5nIHRoZSBib3NzZXMgb2YgdGhlIENpdHkgb2YgQWV0ZXJuYSwgSGVyZXRpYyBDYW5kbGVsaWdodDogS2FuZGVsIHdpbGwgYXBwZWFyIHdpdGggPGUgaWQ9MTQwMj5Tb3VsIENhbmRsZSBGdXNpb248L2U+In0seyJJbmRleCI6ImFmZml4X2NsYXNzfGRlc2NyaXB0aW9ufDIwMDAwMDI4NyIsIlN0YXR1cyI6IiIsIlpoIjoiJCtQMSQlIGFkZGl0aW9uYWwgUGh5c2ljYWwgRGFtYWdlIHRha2VuIHdoaWxlIHRoZSBza2lsbCBsYXN0cyJ9LHsiSW5kZXgiOiJTNl9nYW1lcGxheV9yZWxpY3xuYW1lfDQwIiwiU3RhdHVzIjoiIiwiWmgiOiJBbnhpb3VzIEJsYWNrIEdvYXQncyBIb3JuIn0seyJJbmRleCI6Im1hbnVhbF9ydWxlX2Rlc3xkZXN8MjAwMTAxMDIxMSIsIlN0YXR1cyI6IiIsIlpoIjoiPFJpY2hUZXh0PkJyYW5kIERpdmluaXR5IFNsYXRlIHRvIGFkZCBhZGRpdGlvbmFsIEJyYW5kIFRhbGVudCBOb2RlcyB0byBhIERpdmluaXR5IFNsYXRlLjwvPiJ9LHsiSW5kZXgiOiJhZmZpeF9jbGFzc3xkZXNjcmlwdGlvbnwxMDEwMTA1MDgiLCJTdGF0dXMiOiIiLCJaaCI6IjxlIGlkPTIwMDU4PkV1cGhvcmlhPC9lPjogYWRkaXRpb25hbCBkYW1hZ2UifSx7IkluZGV4IjoiYWZmaXhfY2xhc3N8ZGVzY3JpcHRpb258MTczMTAwMjIiLCJTdGF0dXMiOiIiLCJaaCI6IjxlIGlkPTMxMDAyMj5CYXJyaWVyIG9mIFJhZGlhbmNlPC9lPiJ9LHsiSW5kZXgiOiJ0YWxlbnR8bmFtZXw1MDA3MDEiLCJTdGF0dXMiOiIiLCJaaCI6IkxlZ2VuZGFyeSBNZWRpdW0gVGFsZW50In0seyJJbmRleCI6ImFjaGlldmVtZW50fHRpdGxlfDEwNzAwNTAiLCJTdGF0dXMiOiIiLCJaaCI6IkJhZGxhbmRzIChDYXRleWUpIn0seyJJbmRleCI6Im1hbnVhbF9ydWxlX2Rlc3xkZXN8MTAwMTAxMjAyNiIsIlN0YXR1cyI6IiIsIlpoIjoiPFJpY2hUZXh0IElkPVwiMzEwM1wiPlVsdGltYXRlPC8+PFJpY2hUZXh0PlxcbkluIEZ1bGwgQmxvb20sIFNwaXJpdCBNYWdpIHVzZSB0aGVpciBVbHRpbWF0ZSB3aXRoIGV4dHJlbWVseSBoaWdoIHN0cmVuZ3RoIGFuZCBhIGNvb2xkb3duLjwvPiJ9LHsiSW5kZXgiOiJza2lsbF90YWd8ZGVzfDYwMDAyMTAiLCJTdGF0dXMiOiIiLCJaaCI6IkRlZmVuc2l2ZSJ9LHsiSW5kZXgiOiJTNl9nYW1lcGxheV9uYXJydGl2ZXxjb250ZW50fDI1IiwiU3RhdHVzIjoiIiwiWmgiOiJGb3JnZXQgZXZlcnl0aGluZy4gRm9yZ2V0IGV2ZXJ5dGhpbmcuIEZvcmdldCBldmVyeXRoaW5nLiBGb3JnZXQgZXZlcnl0aGluZy4gRm9yZ2V0IGV2ZXJ5dGhpbmcuIEZvcmdldCBldmVyeXRoaW5nLiJ9LHsiSW5kZXgiOiJzNV9nb29kZHJlYW1fYWZmaXh8ZGVzY3wzMDQwIiwiU3RhdHVzIjoiIiwiWmgiOiI8UmljaFRleHQ+QWRkcyAxIDwvPjxSaWNoVGV4dCBJZD1cIjMxNDNcIiBVZGw9XCIxXCIgSHlwZXJMaW5rVHlwZT1cIjFcIiBFdmVudElkPVwiNTAwMDAxMlwiPkN1YmUgQnViYmxlPC8+PFJpY2hUZXh0PiB0aGF0IGlzIDwvPjxSaWNoVGV4dCBJZD1cIjMxNDNcIiBVZGw9XCIxXCIgSHlwZXJMaW5rVHlwZT1cIjFcIiBFdmVudElkPVwiNTAwMDAwMlwiPkJsdWU8Lz48UmljaFRleHQ+IG9yIGJldHRlcjwvPiJ9LHsiSW5kZXgiOiJyZXNvdXJjZXxuYW1lfDM0NyIsIlN0YXR1cyI6IiIsIlpoIjoiUHJlZmFjZSBvZiBNb2Rlcm4gSGlzdG9yeSBvZiBJY2hpIn0seyJJbmRleCI6ImNvbmRfZXZlbnR8ZGVzfDUwNjAyNjciLCJTdGF0dXMiOiIiLCJaaCI6IkNsZWFyIE5ldGhlcnJlYWxtIFtUaHVuZGVyIFdhc3Rlc10gMjAgdGltZXMgKCVkLyVkKSJ9LHsiSW5kZXgiOiJhZmZpeF9jbGFzc3xkZXNjcmlwdGlvbnw0NjE2MjMiLCJTdGF0dXMiOiIiLCJaaCI6IkdhaW5zICRQMSQgcG9pbnRzIG9mIDxlIGlkPTYxND5SYWdlPC9lPiBpZiA8ZSBpZD02Mzg+U2VldGhpbmcgU3Bpcml0PC9lPiB1c2VzIGEgc2tpbGwgd2hpbGUgPGUgaWQ9NjE1PkJlcnNlcms8L2U+IGlzIG5vdCBhY3RpdmUifSx7IkluZGV4IjoidGFsZV9ucGN8ZGVzfDYyNzc4Mjk0NiIsIlN0YXR1cyI6IiIsIlpoIjoiT25lIGRheSwgYSBodW50cmVzcyBjYWxsZWQgSGFubmFoIHJldHJpZXZlZCB0aGUgbG9zdCBGaXJzdCBGbGFtZSBmcm9tIE1hZ251cy4gV2l0aCBpdCwgc2hlIGNyZWF0ZWQgYXJyb3dzIHRoYXQgc2hlIHVzZWQgdG8gc2hvb3QgZG93biB0aGUgZXZpbCBzdGFycyB0aGF0IGZpbGxlZCB0aGUgc2t5LCByZXR1cm5pbmcgbGlnaHQgdG8gdGhlIGxhbmQgb25jZSBtb3JlLiJ9LHsiSW5kZXgiOiJhY2hpZXZlbWVudHxkZXNjX2xpbnNoaXw0MTYwMDUwIiwiU3RhdHVzIjoiIiwiWmgiOiJMb2cgaW4gKCVkLyVkKSJ9LHsiSW5kZXgiOiJUZXh0VGFibGVfR2FtZUZ1bmN8dmFsdWV8RnVuY19JbkdhbWVEb3dubG9hZF9Eb3dubG9hZFN1Y2Nlc3MiLCJTdGF0dXMiOiIiLCJaaCI6IkRvd25sb2FkIGNvbXBsZXRlIn0seyJJbmRleCI6IlRleHRUYWJsZV9HYW1lRnVuY3x2YWx1ZXxGdW5jX0Ryb3BGaWx0ZXJfRHJvcEJveFRleHREZWNvIiwiU3RhdHVzIjoiIiwiWmgiOiJQcmVmaXhlcyBhbmQgU3VmZml4ZXMifSx7IkluZGV4IjoiYWZmaXhfY2xhc3N8ZGVzY3JpcHRpb258NTQzODQiLCJTdGF0dXMiOiIiLCJaaCI6IkFkZHMgQmFzZSBQaHlzaWNhbCBEYW1hZ2UgZXF1YWwgdG8gJFAxJCUgb2YgdGhlIHN1bSBvZiB0aGUgQ2hhcmFjdGVyJ3MgTWF4IExpZmUgYW5kIEVuZXJneSBTaGllbGQgdG8gdGhlIFNlbGYtRGVzdHJ1Y3Rpb24gY2F1c2VkIGJ5IDxlIGlkPTYzOT5TZWxmLURlc3RydWN0IFByb3RvY29sPC9lPiJ9LHsiSW5kZXgiOiJhZmZpeF9jbGFzc3xkZXNjcmlwdGlvbnwxNTMiLCJTdGF0dXMiOiIiLCJaaCI6IklmIGEgdHlwZSBvZiBFbGVtZW50YWwgRGFtYWdlIHdhcyBkZWFsdCByZWNlbnRseSwgJCtQMSQlIGFkZGl0aW9uYWwgZGFtYWdlIGZvciAyIG90aGVyIHR5cGVzIG9mIEVsZW1lbnRhbCBEYW1hZ2UifSx7IkluZGV4IjoiUzZfZ2FtZXBsYXlfcmVsaWN8ZGVzY3w1MCIsIlN0YXR1cyI6IiIsIlpoIjoiRmlsdGggRWF0ZXJzIGNhbid0IHJlYWQsIGJ1dCB0aGV5IG1pZ2h0IGJlIGFibGUgdG8gdW5kZXJzdGFuZCBzaW1wbGUgbWFwcy5cXG5JdCdzIG9rYXkgaWYgeW91IGdldCBsb3N0LiBKdXN0IGhpcmUgYW5vdGhlciBvbmUuIn0seyJJbmRleCI6ImFmZml4X2NsYXNzfGRlc2NyaXB0aW9ufDU2NTQ0NyIsIlN0YXR1cyI6IiIsIlpoIjoiJCtQMSQlIDxlIGlkPTUwMj5NYXggRXJvc2lvbiBSZXNpc3RhbmNlPC9lPiwgJCtQMiQlIEVyb3Npb24gUmVzaXN0YW5jZSJ9LHsiSW5kZXgiOiJhZmZpeF9jbGFzc3xkZXNjcmlwdGlvbnwxNzcyNTIiLCJTdGF0dXMiOiIiLCJaaCI6IiQrUDEkJSBXYXJjcnkgQ2FzdCBTcGVlZCJ9LHsiSW5kZXgiOiJTNl9nYW1lcGxheV9idWZmfGRlc2N8MzE1MSIsIlN0YXR1cyI6IiIsIlpoIjoiUHJldmlldyAxIGFkZGl0aW9uYWwgcmFuZG9tIENlbGwgd2hlbiByZXZlYWxpbmcgYSBwcmV2aWV3ZWQgQ2VsbCJ9LHsiSW5kZXgiOiJTNl9nYW1lcGxheV9lbmNvdW50ZXJ8c2VsZWN0aW9uRGVzYzJfMXwxMCIsIlN0YXR1cyI6IiIsIlpoIjoiQnV5IHR3byBiYWdzIn0seyJJbmRleCI6InRhbGVudHxuYW1lfDEzMDQwMyIsIlN0YXR1cyI6IiIsIlpoIjoiTWVkaXVtIFRhbGVudCJ9LHsiSW5kZXgiOiJ0YXNrX2Zvcm1hbHxzdWJ0aXRsZV9ndWlkZXwxMTU2MDEyIiwiU3RhdHVzIjoiIiwiWmgiOiJIZWFkIHRvIEF3YWtlbmVkIFNocmluZSJ9LHsiSW5kZXgiOiJtYXBfcG9ydGFsfG5hbWV8MTExMTM4MDEiLCJTdGF0dXMiOiIiLCJaaCI6IlZvbGNhbm8gb2YgRGVhdGgifSx7IkluZGV4IjoiaXRlbV9iYXNlfG5hbWV8OTAwMTM1MCIsIlN0YXR1cyI6IiIsIlpoIjoiU3Bpcml0d29vZCBXYW5kIn0seyJJbmRleCI6Iml0ZW1fZ29sZHxkZXNjcmlwdGlvbnwxMTIzMTMiLCJTdGF0dXMiOiIiLCJaaCI6Ik9ubHkgYSBtYWQgb25lIGhhcyBzdWNoIGEgYmVhdXRpZnVsIGRyZWFtLiJ9LHsiSW5kZXgiOiJ0YXNrX2Zvcm1hbHx0aXRsZXwxMTEyMDA3IiwiU3RhdHVzIjoiIiwiWmgiOiJUd2lsaWdodCBvZiB0aGUgUGFzdCJ9LHsiSW5kZXgiOiJhdHRyaWJ1dGVzX3Nob3d8bmFtZXwxMTAxNTAiLCJTdGF0dXMiOiIiLCJaaCI6Ik1pbmltdW0gUGh5c2ljYWwgdG8gTGlnaHRuaW5nIHRvIENvbGQgLSBNaW4gMTEwMTUwIn0seyJJbmRleCI6Im1hbnVhbF9ydWxlfG5hbWV8MzAwMjAyMDIiLCJTdGF0dXMiOiIiLCJaaCI6IkNvbmZ1c2lvbiBDYXJkIn0seyJJbmRleCI6Iml0ZW1fYmFzZXxkZXNjcmlwdGlvbjF8NjEzOSIsIlN0YXR1cyI6IiIsIlpoIjoiRmx1b3Jlc2NlbnQgTWVtb3J5IFNoYXJkcyJ9LHsiSW5kZXgiOiJ0YWxlbnR8ZGVzX3R5cGUyfDMwMDAyMiIsIlN0YXR1cyI6IiIsIlpoIjoiPGUgaWQ9MzAwMDIyPkJ1cm5pbmcgVG91Y2g8L2U+In0seyJJbmRleCI6ImZ1bmN0aW9uX2Rlc3xkZXN8NSIsIlN0YXR1cyI6IiIsIlpoIjoiSW1tZWRpYXRlbHkgcmVjZWl2ZSAzMDAgUHJpbW9jcnlzdC5cXG5PYnRhaW4gNjAgSmFnZ2VkIFByaW1vY3J5c3QgZXZlcnkgZGF5LiJ9LHsiSW5kZXgiOiJhZmZpeF9jbGFzc3xkZXNjcmlwdGlvbnwxNDEyOCIsIlN0YXR1cyI6IiIsIlpoIjoiJCtQMSQlIFNlbnRyeSBTa2lsbCBjYXN0IGZyZXF1ZW5jeSJ9LHsiSW5kZXgiOiJucGN8bmFtZXwyNDAwMTAwIiwiU3RhdHVzIjoiIiwiWmgiOiJGb3VyIFJlYWxtcyJ9LHsiSW5kZXgiOiJ0YWxlX25wY3xkZXN8ODYwNjgyNTUiLCJTdGF0dXMiOiIiLCJaaCI6IkJ1dCBpdCBpcyBleHRyZW1lbHkgY3JhZnR5LiBXZSBjaGFzZWQgaXQgZG93biBmb3IgYSBsb25nIHRpbWUgYmVmb3JlIHdlIG1hbmFnZWQgdG8gY2FwdHVyZSBpdCBoZXJlLiJ9LHsiSW5kZXgiOiJ0YXNrX2Zvcm1hbHxzdWJ0aXRsZXwxMTQ5MDA1IiwiU3RhdHVzIjoiIiwiWmgiOiJFbmNoYW50IHRoZSBjcmFmdGVkIGdlYXIgMSB0aW1lIn0seyJJbmRleCI6Imh5cGVybGlua3xuYW1lfDYwMDAwMDUiLCJTdGF0dXMiOiIiLCJaaCI6IkV4cGxvcmVyJ3MgR2xhc3NlcyJ9LHsiSW5kZXgiOiJpdGVtX2Jhc2V8ZGVzY3JpcHRpb24xfDQwNDMwNCIsIlN0YXR1cyI6IiIsIlpoIjoiVGh1bmRlciBXYXN0ZXMgUGxhbmUgfCBSYW5rIDUgQmVhY29uIn0seyJJbmRleCI6IlRleHRUYWJsZV9HYW1lRnVuY3x2YWx1ZXxGdW5jX215c3RpY0Jvc3NfM182XzMwNTEiLCJTdGF0dXMiOiIiLCJaaCI6IkRlZmVhdCBUcmF2ZWxlcnMgYjEgdGltZXMgKFRpbWVtYXJrIDcpIn0seyJJbmRleCI6Im5wY3xuYW1lfDEwMjAwMjciLCJTdGF0dXMiOiIiLCJaaCI6IlRyb2cgU2VudHJ5In0seyJJbmRleCI6ImNvbmRfZXZlbnR8ZGVzfDUwNjAzMjEiLCJTdGF0dXMiOiIiLCJaaCI6IlVzZSAyMCBSYW5rIDUgQmVhY29ucyJ9LHsiSW5kZXgiOiJpdGVtX2dvbGR8bmFtZXwxMTIyMTMiLCJTdGF0dXMiOiIiLCJaaCI6IlNpcmVuIEZhY2VndWFyZCJ9LHsiSW5kZXgiOiJoeXBlcmxpbmt8bmFtZXwzMjAwMTEiLCJTdGF0dXMiOiIiLCJaaCI6IkZyb3N0Yml0dGVuIn0seyJJbmRleCI6Iml0ZW1fZ29sZHxwcmVmaXgxX2Rlc3wyMDA1IiwiU3RhdHVzIjoiIiwiWmgiOiI8UmFuZG9tIEFybW9yLCBFbmVyZ3kgU2hpZWxkLCBFdmFkZSBhZmZpeD4ifSx7IkluZGV4IjoibnBjfG5hbWV8MjE5MDA3MyIsIlN0YXR1cyI6IiIsIlpoIjoiUm9hZCBvZiB0aGUgTW9vbiBUcmVhc3VyZSBDaGVzdCJ9LHsiSW5kZXgiOiJTNl9nYW1lcGxheV90YWxlbnR8ZGVzY19mdW5jfDgiLCJTdGF0dXMiOiIiLCJaaCI6IjxSaWNoVGV4dD5RdWFudGl0eSBvZiBPbGQgU3R1ZmYgc29sZCBieSB0aGUgTWlzdHZpbGxlIFRyYWRlciA8Lz48UmljaFRleHQgSWQ9XCIzNTEzXCI+KyVzPC8+In0seyJJbmRleCI6Iml0ZW1fYmFzZXxkZXNjcmlwdGlvbjF8NzQzNiIsIlN0YXR1cyI6IiIsIlpoIjoiU2tpbGwifSx7IkluZGV4IjoiaXRlbV9iYXNlfGRlc2NyaXB0aW9uMnw0OCIsIlN0YXR1cyI6IiIsIlpoIjoiT25lLUhhbmRlZCJ9LHsiSW5kZXgiOiJpdGVtX2dvbGR8ZGVzY3JpcHRpb258MTEwNzA0IiwiU3RhdHVzIjoiIiwiWmgiOiJJdCB3YXMgZm9yIHBpZXJjaW5nIHRocm91Z2ggeW91IGZyb20gdGhlIGJlZ2lubmluZy4ifSx7IkluZGV4IjoiY29sbGVjdGlvbl90eXBlMXxuYW1lfDEiLCJTdGF0dXMiOiIiLCJaaCI6IlBhZ2VzIn0seyJJbmRleCI6ImFmZml4X2NsYXNzfGRlc2NyaXB0aW9ufDEwMzQ5MDAwMSIsIlN0YXR1cyI6IiIsIlpoIjoiJFAxJCUgY2hhbmNlIHRvIHNwcmVhZCA8ZSBpZD03MTA+SWduaXRlPC9lPiB0byA8ZSBpZD0xMDI+TmVhcmJ5PC9lPiBlbmVtaWVzIHVwb24gaW5mbGljdGluZyA8ZSBpZD03MTA+SWduaXRlPC9lPiJ9LHsiSW5kZXgiOiJ0YXNrX2Zvcm1hbHxzdWJ0aXRsZV9ndWlkZXwxMDg5MDAzIiwiU3RhdHVzIjoiIiwiWmgiOiJIZWFkIHRvIFN0YXIncyBGYWxsIn0seyJJbmRleCI6Im5wY3xuYW1lfDEzMTAxMjYiLCJTdGF0dXMiOiIiLCJaaCI6IkdvYmxpbiBEYXJ0IEJsb3dlciJ9LHsiSW5kZXgiOiJhZmZpeF9jbGFzc3xkZXNjcmlwdGlvbnw5MzAwNyIsIlN0YXR1cyI6IiIsIlpoIjoiPGUgaWQ9MjMwMDc+QnkgTXkgU2lkZSAtIEljZS1GaXJlIEZ1c2lvbjwvZT4ifSx7IkluZGV4Ijoic2VydmFudHxkZXNfZWZmZWN0fDExMTEwIiwiU3RhdHVzIjoiIiwiWmgiOiJJbmNyZWFzZXMgRHJvcCBRdWFudGl0eSJ9LHsiSW5kZXgiOiJzZXJ2YW50fGRlc19lZmZlY3R8ODUzMCIsIlN0YXR1cyI6IiIsIlpoIjoiSW5jcmVhc2VzIGRhbWFnZSwgd2Vha2VucyB0aGUgQ3Vyc2VkIGVuZW1pZXMsIGFuZCBoYXMgYSBDdXJzZSBlZmZlY3QifSx7IkluZGV4IjoiVGV4dFRhYmxlX05ldENvZGV8dmFsdWV8TmV0X0JhY2tfQ29kZV85IiwiU3RhdHVzIjoiIiwiWmgiOiJTYXZpbmcgaGVybyBkYXRhIn0seyJJbmRleCI6ImFmZml4X2NsYXNzfGRlc2NyaXB0aW9ufDE3MTAwMDIxIiwiU3RhdHVzIjoiIiwiWmgiOiI8ZSBpZD0xMDAwMjE+R3JlYXQgU3RyZW5ndGg8L2U+In0seyJJbmRleCI6ImxldmVsfG5hbWV8NDU0MiIsIlN0YXR1cyI6IiIsIlpoIjoiU2hyaW5lIG9mIEFnb255In0seyJJbmRleCI6ImxldmVsfG5hbWV8NDAwMzA0IiwiU3RhdHVzIjoiIiwiWmgiOiJTa2lydGhlbSBvZiBHb2RkZXNzIn0seyJJbmRleCI6InNraWxsX2Rlc3xkZXNfY29uZmlnfDUwMDIwMCIsIlN0YXR1cyI6IiIsIlpoIjoiQWN0aXZhdGVzIHRoZSBBdXJhLCB5b3UgYW5kIGFsbGllcyB3aXRoaW4gYSBjZXJ0YWluIGFyZWEgZ2FpbiB0aGUgZm9sbG93aW5nIGJ1ZmY6XFxuPHA+eyVzOjF9JSU8L3A+IGFkZGl0aW9uYWwgUGh5c2ljYWwgRGFtYWdlLiJ9LHsiSW5kZXgiOiJhZmZpeF9jbGFzc3xkZXNjcmlwdGlvbnwxMDMzMzYwMjEiLCJTdGF0dXMiOiIiLCJaaCI6IkluIFRyaWFsOiBHb2Qgb2YgTWFjaGluZXMsIHRoZSBpbnRlcnZhbCBiZXR3ZWVuIGVuZW15IGF0dGFjayB3YXZlcyBpcyByZWR1Y2VkIHRvICRQMSQgcyJ9LHsiSW5kZXgiOiJhZmZpeF9jbGFzc3xkZXNjcmlwdGlvbnwyMDAwMDAwOTIiLCJTdGF0dXMiOiIiLCJaaCI6IlVwb24gcmVjZWl2aW5nIDxlIGlkPTEwNT5GYXRhbCBEYW1hZ2U8L2U+LCBsb3NlcyB0aGUgPGUgaWQ9NjI2PlNwYWNldGltZSBJbGx1c2lvbjwvZT4gYW5kIHVzZXMgdGhlIHBvd2VyIG9mIFNwYWNldGltZSB0byBiZWNvbWUgaW1tdW5lIHRvIHRoZSBkYW1hZ2UsIDxlIGlkPTcwMz5Lbm9jayBCYWNrPC9lPiA8ZSBpZD0xMDI+bmVhcmJ5PC9lPiBlbmVtaWVzLCBhbmQgcmVzdG9yZSAkUDEkJSBvZiBNaXNzaW5nIExpZmUgYW5kIEVuZXJneSBTaGllbGQuIEludGVydmFsOiAkUDIkcyJ9LHsiSW5kZXgiOiJucGN8bmFtZXwxMTIwMDUyIiwiU3RhdHVzIjoiIiwiWmgiOiJUd2lzdGVkIEFnaXRvIn0seyJJbmRleCI6ImFmZml4X2NsYXNzfGRlc2NyaXB0aW9ufDIwNjYxMSIsIlN0YXR1cyI6IiIsIlpoIjoiJCtQMSQlIGFkZGl0aW9uYWwgZGFtYWdlIGZvciBldmVyeSA1JSBjdXJyZW50IE1hbmEifSx7IkluZGV4IjoiYWZmaXhfY2xhc3N8ZGVzY3JpcHRpb258MzkyMTk0IiwiU3RhdHVzIjoiIiwiWmgiOiJXaGlsZSB0aGUgc2tpbGwgbGFzdHMsIGRlYWxzIGhpZ2hlciBkYW1hZ2UgdG8gcmFyZXIgZW5lbWllcywgdXAgdG8gJCtQMSQlIGFkZGl0aW9uYWwgZGFtYWdlIn0seyJJbmRleCI6InNwX2NhcmRfdjJ8bmFtZXw5MDEwMjAyMSIsIlN0YXR1cyI6IiIsIlpoIjoiUGVyc2lzdGVudCAtIE1pZ2h0In0seyJJbmRleCI6Iml0ZW1fYmFzZXxkZXNjcmlwdGlvbjJ8MzQwMyIsIlN0YXR1cyI6IiIsIlpoIjoiSGFuZHMifSx7IkluZGV4IjoibWFpbl9zdG9yeXxkZXNjcmliZXwyMTMwMDEiLCJTdGF0dXMiOiIiLCJaaCI6IlRoaXMgbXlzdGVyaW91cywgaGVhdmlseSBndWFyZGVkIG1vbmFzdGVyeSBpcyBhIGZvcmJpZGRlbiBwbGFjZSBvZiB0aGUgQ2h1cmNoIHRoYXQgY2Fubm90IGV2ZW4gYmUgbWVudGlvbmVkLiBIb3dldmVyLCBpdCBoaWRlcyB0aGUgc2VjcmV0IG9mIHRoZSBcIlNlY29uZCBDaHVyY2guXCIifSx7IkluZGV4IjoiVGV4dFRhYmxlX05ldENvZGV8dmFsdWV8TmV0X0JhY2tfQ29kZV85MDEiLCJTdGF0dXMiOiIiLCJaaCI6Ikhlcm8gVHJhaXQgZG9lcyBubyBhcHBseSB0byB0aGUgY3VycmVudCBoZXJvIn0seyJJbmRleCI6Imd1aWRlfGRlc19wY3wxMTAwIiwiU3RhdHVzIjoiIiwiWmgiOiJPcGVuIHRoZSBtZW51In0seyJJbmRleCI6InRhc2tfZm9ybWFsfHN1YnRpdGxlX2d1aWRlfDExMjEwMDMiLCJTdGF0dXMiOiIiLCJaaCI6IkhlYWQgdG8gU3BhcmsgSGFsbCJ9LHsiSW5kZXgiOiJtYWluX3N0b3J5fG5hbWV8NDAyMDUwIiwiU3RhdHVzIjoiIiwiWmgiOiJHcmlmZmluJ3MgTmVzdCJ9LHsiSW5kZXgiOiJzcF9jYXJkX2NsYXNzX3YyfG5hbWV8NCIsIlN0YXR1cyI6IiIsIlpoIjoiTWVtb3J5IEZyYWdtZW50In0seyJJbmRleCI6ImFjaGlldmVtZW50fGRlc2NfbGluc2hpfDUwNjAyMzQiLCJTdGF0dXMiOiIiLCJaaCI6IkNsZWFyIDIwIEdsYWNpYWwgQWJ5c3Mgc3RhZ2VzICglZC8lZCkifSx7IkluZGV4Ijoid2VhcG9ufGdyb3VwX25hbWV8NCIsIlN0YXR1cyI6IiIsIlpoIjoiT25lLUhhbmRlZCBTd29yZC9IYW1tZXIvQXhlL0RhZ2dlciJ9LHsiSW5kZXgiOiJtb25leXxkZXNjcmlwdGlvbnw2MzEwIiwiU3RhdHVzIjoiIiwiWmgiOiJIYXBweSBDaG9ua3kncyB1cGdyYWRlIG1hdGVyaWFsLiJ9LHsiSW5kZXgiOiJsZXZlbHxuYW1lfDUwMDQiLCJTdGF0dXMiOiIiLCJaaCI6IlN3aXJsaW5nIE1pbmVzIChTY29yY2hpbmcpIn0seyJJbmRleCI6InNwX2NhcmRfdjJ8bmFtZXwxMDAyMDA4MyIsIlN0YXR1cyI6IiIsIlpoIjoiIn0seyJJbmRleCI6InJlc291cmNlfG5hbWV8NDUxIiwiU3RhdHVzIjoiIiwiWmgiOiJOaW5hIHRoZSBIdW50ZXIifSx7IkluZGV4Ijoic2tpbGxfZGVzfGRlc19jb25maWd8MTAwMDI2MTAwIiwiU3RhdHVzIjoiIiwiWmgiOiJTdXBwb3J0cyBBdXJhIFNraWxscy5cXG57JXM6MX0ifSx7IkluZGV4IjoiVGV4dFRhYmxlX0dhbWVGdW5jfHZhbHVlfEZ1bmNfTXlzdGVyeV9SZXdhcmRGaXJzdFBhc3MiLCJTdGF0dXMiOiIiLCJaaCI6IkZpcnN0IENsZWFyIFJld2FyZCJ9LHsiSW5kZXgiOiJmdW5jdGlvbnxkZXN8MTQ5IiwiU3RhdHVzIjoiIiwiWmgiOiIxIn1d");

	const {colids, entries} = csvUtil.parse(raw, {colidMapper : v => v.toProperCase(), returnColids : true});
	assertEquals(colids, ["Index", "Status", "Zh"]);
	assertStrictEquals(entries.length, 100);
});

Deno.test("parseCSV2", async () =>
{
	const raw = await fileUtil.readTextFile(path.join(import.meta.dirname, "files", "test2.csv"));
	assertStrictEquals(base64Encode(JSON.stringify(csvUtil.parse(raw))), "W3siaWQiOiIxNjQ4IiwiYWZmaXhfZWZmZWN0cyI6IjEiLCJzY29wZSI6IjAiLCJkZXNjcmlwdGlvbiI6ImFmZml4X2NsYXNzfGRlc2NyaXB0aW9ufDE2NDgiLCJkZXRhaWxfZGVzY3JpcHRpb24iOiIiLCJwYXJhbWV0ZXJfYWJzdHJhY3QiOiJQMSwwfFAyLDAiLCJwYXJhbWV0ZXJfZXh0cmEiOiJbe1wibmFtZVwiOlwiUDFcIixcInR5cGVcIjpcImZsb2F0XCIsXCJtZXRhRGF0YVwiOntcInVuc3RhY2thYmxlXCI6XCJcIixcImZyYWN0aW9uYWxEaWdpdHNcIjpcIjNcIn19LHtcIm5hbWVcIjpcIlAyXCIsXCJ0eXBlXCI6XCJmbG9hdFwiLFwibWV0YURhdGFcIjp7XCJ1bnN0YWNrYWJsZVwiOlwiXCIsXCJmcmFjdGlvbmFsRGlnaXRzXCI6XCIzXCJ9fV0iLCJyb3dfbmFtZSI6IjhCOUZGNzE0NERCQUI5NkQzN0Q3OEQ4NUU2NzA2OTQwIn1d");
});

Deno.test("parseCSV3", async () =>
{
	const raw = await fileUtil.readTextFile(path.join(import.meta.dirname, "files", "test3.csv"));
	assertStrictEquals(base64Encode(JSON.stringify(csvUtil.parse(raw))), "W3siaWQiOiIxNCIsInN0ciI6Ilt7XCJuYW1lXCI6XCJQMVwiLFwidHlwZVwiIiwic3VmZml4IjoiOTkifSx7ImlkIjoiNDciLCJzdHIiOiJkb3VibGVcIlwicXVcIixcIm90ZWRcIlwiLFwiXCJjb21tYSIsInN1ZmZpeCI6IjY5In1d");
});

