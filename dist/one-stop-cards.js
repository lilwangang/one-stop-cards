/*!
 * One Stop – Room Lights card
 * One Stop Smart Homes · standalone Home Assistant dashboard card (no other add-ons needed)
 * Everything is set from the visual card editor.
 */
(() => {
'use strict';
const VERSION = '1.0.0';
const TAG = 'one-stop-room-lights-card';
const EDITOR_TAG = TAG + '-editor';
const POPUP_TAG = 'one-stop-room-lights-popup';
const PICTURES = {"bathroom": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 320 126\" width=\"100%\" height=\"100%\" aria-hidden=\"true\"><rect x=\"0\" y=\"0\" width=\"320\" height=\"126\" rx=\"15\" fill=\"color-mix(in srgb,var(--room-accent) 25%,#141414)\"/><path d=\"M22 104L298 104\" stroke=\"color-mix(in srgb,var(--room-accent) 37%,#141414)\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><rect x=\"112\" y=\"13\" width=\"96\" height=\"52\" rx=\"15\" fill=\"color-mix(in srgb,var(--room-accent) 44%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><rect x=\"91\" y=\"75\" width=\"138\" height=\"26\" rx=\"5\" fill=\"color-mix(in srgb,var(--room-accent) 49%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><path d=\"M105 76Q160 99 214 76\" fill=\"color-mix(in srgb,var(--room-accent) 80%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M160 75V63Q160 56 168 56Q176 56 176 63\" fill=\"none\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M160 83L160 99\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><circle cx=\"151\" cy=\"90\" r=\"1\" fill=\"color-mix(in srgb,var(--room-accent) 70%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><circle cx=\"170\" cy=\"90\" r=\"1\" fill=\"color-mix(in srgb,var(--room-accent) 70%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><rect x=\"41\" y=\"56\" width=\"24\" height=\"41\" rx=\"5\" fill=\"color-mix(in srgb,var(--room-accent) 39%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><path d=\"M42 71L64 71\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><g class=\"art-lights\"><rect x=\"107\" y=\"10\" width=\"106\" height=\"5\" rx=\"2\" fill=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke-width=\"1.5\"/><path d=\"M114 17L114 60\" stroke=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke-width=\"2\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M94 103L225 103\" stroke=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke-width=\"2\" fill=\"none\" stroke-linecap=\"round\"/></g><text x=\"298\" y=\"119\" text-anchor=\"end\" fill=\"color-mix(in srgb,var(--room-accent) 81%,#141414)\" font-family=\"Arial,sans-serif\" font-size=\"9.5\">Ceiling &amp; vanity lighting</text></svg>", "bedroom": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 320 126\" width=\"100%\" height=\"100%\" aria-hidden=\"true\"><rect x=\"0\" y=\"0\" width=\"320\" height=\"126\" rx=\"15\" fill=\"color-mix(in srgb,var(--room-accent) 27%,#141414)\"/><path d=\"M22 104L298 104\" stroke=\"color-mix(in srgb,var(--room-accent) 37%,#141414)\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><rect x=\"90\" y=\"25\" width=\"140\" height=\"53\" rx=\"12\" fill=\"color-mix(in srgb,var(--room-accent) 54%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><rect x=\"83\" y=\"54\" width=\"154\" height=\"43\" rx=\"9\" fill=\"color-mix(in srgb,var(--room-accent) 64%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><rect x=\"89\" y=\"58\" width=\"67\" height=\"18\" rx=\"5\" fill=\"color-mix(in srgb,var(--room-accent) 82%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><rect x=\"164\" y=\"58\" width=\"67\" height=\"18\" rx=\"5\" fill=\"color-mix(in srgb,var(--room-accent) 82%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><path d=\"M84 79H237V96H84Z\" fill=\"color-mix(in srgb,var(--room-accent) 68%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><rect x=\"44\" y=\"76\" width=\"30\" height=\"24\" rx=\"3\" fill=\"color-mix(in srgb,var(--room-accent) 42%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><rect x=\"246\" y=\"76\" width=\"30\" height=\"24\" rx=\"3\" fill=\"color-mix(in srgb,var(--room-accent) 42%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><path d=\"M59 59L59 75\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M261 59L261 75\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><g class=\"art-lights\"><path d=\"M45 58L49 39H69L73 58Z\" fill=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke-width=\"1.5\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M247 58L251 39H271L275 58Z\" fill=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke-width=\"1.5\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M96 100L225 100\" stroke=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke-width=\"2\" fill=\"none\" stroke-linecap=\"round\"/></g><text x=\"298\" y=\"119\" text-anchor=\"end\" fill=\"color-mix(in srgb,var(--room-accent) 81%,#141414)\" font-family=\"Arial,sans-serif\" font-size=\"9.5\">Bedside &amp; soft lighting</text></svg>", "office": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 320 126\" width=\"100%\" height=\"100%\" aria-hidden=\"true\"><rect x=\"0\" y=\"0\" width=\"320\" height=\"126\" rx=\"15\" fill=\"color-mix(in srgb,var(--room-accent) 26%,#141414)\"/><path d=\"M22 104L298 104\" stroke=\"color-mix(in srgb,var(--room-accent) 37%,#141414)\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><rect x=\"53\" y=\"80\" width=\"218\" height=\"8\" rx=\"2\" fill=\"color-mix(in srgb,var(--room-accent) 51%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><path d=\"M67 89L67 103\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M254 89L254 103\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><rect x=\"73\" y=\"18\" width=\"104\" height=\"47\" rx=\"5\" fill=\"color-mix(in srgb,var(--room-accent) 35%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><rect x=\"185\" y=\"30\" width=\"54\" height=\"35\" rx=\"5\" fill=\"color-mix(in srgb,var(--room-accent) 40%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><path d=\"M125 66L125 79\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M111 78L139 78\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M212 66L212 79\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><rect x=\"267\" y=\"60\" width=\"20\" height=\"42\" rx=\"3\" fill=\"color-mix(in srgb,var(--room-accent) 37%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><circle cx=\"277\" cy=\"70\" r=\"2\" fill=\"color-mix(in srgb,var(--room-accent) 53%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><path d=\"M84 32L161 32\" stroke=\"color-mix(in srgb,var(--room-accent) 70%,#141414)\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M84 40L136 40\" stroke=\"color-mix(in srgb,var(--room-accent) 70%,#141414)\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M84 48L147 48\" stroke=\"color-mix(in srgb,var(--room-accent) 70%,#141414)\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><g class=\"art-lights\"><path d=\"M62 90L263 90\" stroke=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke-width=\"3\" fill=\"none\" stroke-linecap=\"round\"/><rect x=\"77\" y=\"21\" width=\"96\" height=\"3\" rx=\"1\" fill=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke-width=\"1.5\"/><path d=\"M197 40L228 40\" stroke=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/></g><text x=\"298\" y=\"119\" text-anchor=\"end\" fill=\"color-mix(in srgb,var(--room-accent) 81%,#141414)\" font-family=\"Arial,sans-serif\" font-size=\"9.5\">Desk &amp; monitor lighting</text></svg>", "kitchen": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 320 126\" width=\"100%\" height=\"100%\" aria-hidden=\"true\"><rect x=\"0\" y=\"0\" width=\"320\" height=\"126\" rx=\"15\" fill=\"color-mix(in srgb,var(--room-accent) 26%,#141414)\"/><path d=\"M22 104L298 104\" stroke=\"color-mix(in srgb,var(--room-accent) 37%,#141414)\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><rect x=\"34\" y=\"16\" width=\"42\" height=\"37\" rx=\"4\" fill=\"color-mix(in srgb,var(--room-accent) 50%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><rect x=\"81\" y=\"16\" width=\"42\" height=\"37\" rx=\"4\" fill=\"color-mix(in srgb,var(--room-accent) 50%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><rect x=\"128\" y=\"16\" width=\"42\" height=\"37\" rx=\"4\" fill=\"color-mix(in srgb,var(--room-accent) 50%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><path d=\"M201 20H242L249 38H194Z\" fill=\"color-mix(in srgb,var(--room-accent) 47%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><rect x=\"27\" y=\"63\" width=\"265\" height=\"9\" rx=\"3\" fill=\"color-mix(in srgb,var(--room-accent) 75%,#141414)\" stroke=\"color-mix(in srgb,var(--room-accent) 75%,#141414)\" stroke-width=\"1.5\"/><rect x=\"33\" y=\"73\" width=\"84\" height=\"30\" rx=\"3\" fill=\"color-mix(in srgb,var(--room-accent) 43%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><rect x=\"121\" y=\"73\" width=\"86\" height=\"30\" rx=\"3\" fill=\"color-mix(in srgb,var(--room-accent) 43%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><rect x=\"211\" y=\"73\" width=\"75\" height=\"30\" rx=\"3\" fill=\"color-mix(in srgb,var(--room-accent) 43%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><path d=\"M75 74L75 101\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M164 74L164 101\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M153 62V49Q153 43 160 43Q168 43 168 51\" fill=\"none\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M139 63Q158 76 177 63\" fill=\"none\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"227\" cy=\"65\" r=\"5\" fill=\"color-mix(in srgb,var(--room-accent) 26%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><circle cx=\"251\" cy=\"65\" r=\"5\" fill=\"color-mix(in srgb,var(--room-accent) 26%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><g class=\"art-lights\"><path d=\"M37 56L169 56\" stroke=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke-width=\"3\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M202 43L240 43\" stroke=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke-width=\"2.5\" fill=\"none\" stroke-linecap=\"round\"/></g><text x=\"298\" y=\"119\" text-anchor=\"end\" fill=\"color-mix(in srgb,var(--room-accent) 81%,#141414)\" font-family=\"Arial,sans-serif\" font-size=\"9.5\">Counters, sink &amp; stove</text></svg>", "living_room": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 320 126\" width=\"100%\" height=\"100%\" aria-hidden=\"true\"><rect x=\"0\" y=\"0\" width=\"320\" height=\"126\" rx=\"15\" fill=\"color-mix(in srgb,var(--room-accent) 26%,#141414)\"/><path d=\"M22 104L298 104\" stroke=\"color-mix(in srgb,var(--room-accent) 37%,#141414)\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><rect x=\"30\" y=\"18\" width=\"60\" height=\"45\" rx=\"7\" fill=\"color-mix(in srgb,var(--room-accent) 31%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><path d=\"M60 19L60 62\" stroke=\"color-mix(in srgb,var(--room-accent) 58%,#141414)\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M31 40L89 40\" stroke=\"color-mix(in srgb,var(--room-accent) 58%,#141414)\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><rect x=\"111\" y=\"48\" width=\"123\" height=\"35\" rx=\"10\" fill=\"color-mix(in srgb,var(--room-accent) 39%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><rect x=\"103\" y=\"65\" width=\"140\" height=\"28\" rx=\"9\" fill=\"color-mix(in srgb,var(--room-accent) 48%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><rect x=\"111\" y=\"55\" width=\"56\" height=\"26\" rx=\"6\" fill=\"color-mix(in srgb,var(--room-accent) 57%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><rect x=\"169\" y=\"55\" width=\"56\" height=\"26\" rx=\"6\" fill=\"color-mix(in srgb,var(--room-accent) 57%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><path d=\"M115 94L115 102\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M231 94L231 102\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M269 54L269 101\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M256 102L282 102\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><g class=\"art-lights\"><path d=\"M253 51L259 29H279L285 51Z\" fill=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke-width=\"1.5\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g><text x=\"298\" y=\"119\" text-anchor=\"end\" fill=\"color-mix(in srgb,var(--room-accent) 81%,#141414)\" font-family=\"Arial,sans-serif\" font-size=\"9.5\">Lamps &amp; TV lighting</text></svg>", "hallway": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 320 126\" width=\"100%\" height=\"100%\" aria-hidden=\"true\"><rect x=\"0\" y=\"0\" width=\"320\" height=\"126\" rx=\"15\" fill=\"color-mix(in srgb,var(--room-accent) 26%,#141414)\"/><path d=\"M22 104L298 104\" stroke=\"color-mix(in srgb,var(--room-accent) 37%,#141414)\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M25 15L111 36V103H25Z\" fill=\"color-mix(in srgb,var(--room-accent) 37%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M295 15L209 36V103H295Z\" fill=\"color-mix(in srgb,var(--room-accent) 37%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M111 36H209V103H111Z\" fill=\"color-mix(in srgb,var(--room-accent) 30%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M128 103L142 68H179L193 103Z\" fill=\"color-mix(in srgb,var(--room-accent) 48%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><rect x=\"47\" y=\"37\" width=\"32\" height=\"47\" rx=\"2\" fill=\"color-mix(in srgb,var(--room-accent) 45%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><rect x=\"235\" y=\"40\" width=\"37\" height=\"34\" rx=\"4\" fill=\"color-mix(in srgb,var(--room-accent) 38%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><path d=\"M44 85L84 85\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M242 76L242 98\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M268 76L268 98\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><rect x=\"244\" y=\"50\" width=\"7\" height=\"17\" rx=\"1\" fill=\"color-mix(in srgb,var(--room-accent) 52%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><rect x=\"254\" y=\"55\" width=\"7\" height=\"12\" rx=\"1\" fill=\"color-mix(in srgb,var(--room-accent) 64%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><g class=\"art-lights\"><circle cx=\"145\" cy=\"21\" r=\"3\" fill=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke-width=\"1.5\"/><circle cx=\"175\" cy=\"21\" r=\"3\" fill=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke-width=\"1.5\"/><path d=\"M239 76L270 76\" stroke=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke-width=\"2\" fill=\"none\" stroke-linecap=\"round\"/></g><text x=\"298\" y=\"119\" text-anchor=\"end\" fill=\"color-mix(in srgb,var(--room-accent) 81%,#141414)\" font-family=\"Arial,sans-serif\" font-size=\"9.5\">Hallway &amp; display lighting</text></svg>", "staircase": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 320 126\" width=\"100%\" height=\"100%\" aria-hidden=\"true\"><rect x=\"0\" y=\"0\" width=\"320\" height=\"126\" rx=\"15\" fill=\"color-mix(in srgb,var(--room-accent) 26%,#141414)\"/><path d=\"M22 104L298 104\" stroke=\"color-mix(in srgb,var(--room-accent) 37%,#141414)\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M63 103V85H99V67H135V49H171V31H207V13H244V103Z\" fill=\"color-mix(in srgb,var(--room-accent) 48%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M57 79L224 4\" fill=\"none\" stroke=\"color-mix(in srgb,var(--room-accent) 76%,#141414)\" stroke-width=\"2.5\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M72 71L72 86\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M122 49L122 66\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M172 27L172 48\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M221 5L221 29\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><g class=\"art-lights\"><path d=\"M65 86L96 86\" stroke=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke-width=\"2.5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M102 68L132 68\" stroke=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke-width=\"2.5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M138 50L168 50\" stroke=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke-width=\"2.5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M174 32L204 32\" stroke=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke-width=\"2.5\" fill=\"none\" stroke-linecap=\"round\"/></g><text x=\"298\" y=\"119\" text-anchor=\"end\" fill=\"color-mix(in srgb,var(--room-accent) 81%,#141414)\" font-family=\"Arial,sans-serif\" font-size=\"9.5\">Ceiling &amp; step lighting</text></svg>", "outside": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 320 126\" width=\"100%\" height=\"100%\" aria-hidden=\"true\"><rect x=\"0\" y=\"0\" width=\"320\" height=\"126\" rx=\"15\" fill=\"color-mix(in srgb,var(--room-accent) 23%,#141414)\"/><path d=\"M22 104L298 104\" stroke=\"color-mix(in srgb,var(--room-accent) 37%,#141414)\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M70 36L160 5L250 36\" fill=\"color-mix(in srgb,var(--room-accent) 33%,#141414)\" stroke=\"color-mix(in srgb,var(--room-accent) 65%,#141414)\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><rect x=\"87\" y=\"37\" width=\"146\" height=\"65\" rx=\"3\" fill=\"color-mix(in srgb,var(--room-accent) 40%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><rect x=\"135\" y=\"46\" width=\"50\" height=\"56\" rx=\"4\" fill=\"color-mix(in srgb,var(--room-accent) 53%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><circle cx=\"173\" cy=\"76\" r=\"1.5\" fill=\"color-mix(in srgb,var(--room-accent) 70%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><rect x=\"97\" y=\"49\" width=\"21\" height=\"30\" rx=\"2\" fill=\"color-mix(in srgb,var(--room-accent) 28%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><rect x=\"201\" y=\"49\" width=\"21\" height=\"30\" rx=\"2\" fill=\"color-mix(in srgb,var(--room-accent) 28%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><rect x=\"43\" y=\"87\" width=\"24\" height=\"15\" rx=\"3\" fill=\"color-mix(in srgb,var(--room-accent) 39%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><path d=\"M55 86Q29 66 44 58Q57 59 55 86Q71 61 78 72Q80 82 55 86\" fill=\"color-mix(in srgb,var(--room-accent) 51%,#141414)\" stroke=\"color-mix(in srgb,var(--room-accent) 68%,#141414)\" stroke-width=\"1.5\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M91 104L229 104\" stroke=\"color-mix(in srgb,var(--room-accent) 53%,#141414)\" stroke-width=\"3\" fill=\"none\" stroke-linecap=\"round\"/><g class=\"art-lights\"><rect x=\"76\" y=\"47\" width=\"7\" height=\"19\" rx=\"2\" fill=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke-width=\"1.5\"/><rect x=\"238\" y=\"47\" width=\"7\" height=\"19\" rx=\"2\" fill=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke-width=\"1.5\"/><path d=\"M90 37L230 37\" stroke=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke-width=\"2\" fill=\"none\" stroke-linecap=\"round\"/></g><text x=\"298\" y=\"119\" text-anchor=\"end\" fill=\"color-mix(in srgb,var(--room-accent) 81%,#141414)\" font-family=\"Arial,sans-serif\" font-size=\"9.5\">Front &amp; back porch</text></svg>", "laundry": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 320 126\" width=\"100%\" height=\"100%\" aria-hidden=\"true\"><rect x=\"0\" y=\"0\" width=\"320\" height=\"126\" rx=\"15\" fill=\"color-mix(in srgb,var(--room-accent) 26%,#141414)\"/><path d=\"M22 104L298 104\" stroke=\"color-mix(in srgb,var(--room-accent) 37%,#141414)\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><rect x=\"61\" y=\"31\" width=\"98\" height=\"71\" rx=\"7\" fill=\"color-mix(in srgb,var(--room-accent) 60%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><rect x=\"66\" y=\"36\" width=\"88\" height=\"13\" rx=\"3\" fill=\"color-mix(in srgb,var(--room-accent) 79%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><circle cx=\"112\" cy=\"42\" r=\"3\" fill=\"color-mix(in srgb,var(--room-accent) 47%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><circle cx=\"110\" cy=\"75\" r=\"22\" fill=\"color-mix(in srgb,var(--room-accent) 35%,#141414)\" stroke=\"color-mix(in srgb,var(--room-accent) 72%,#141414)\" stroke-width=\"1.5\"/><circle cx=\"110\" cy=\"75\" r=\"16\" fill=\"color-mix(in srgb,var(--room-accent) 47%,#141414)\" stroke=\"color-mix(in srgb,var(--room-accent) 57%,#141414)\" stroke-width=\"1.5\"/><rect x=\"185\" y=\"47\" width=\"80\" height=\"7\" rx=\"2\" fill=\"color-mix(in srgb,var(--room-accent) 55%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><path d=\"M194 55L194 103\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M255 55L255 103\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><rect x=\"195\" y=\"36\" width=\"56\" height=\"10\" rx=\"3\" fill=\"color-mix(in srgb,var(--room-accent) 66%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><rect x=\"200\" y=\"25\" width=\"51\" height=\"10\" rx=\"3\" fill=\"color-mix(in srgb,var(--room-accent) 61%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><rect x=\"209\" y=\"15\" width=\"42\" height=\"9\" rx=\"3\" fill=\"color-mix(in srgb,var(--room-accent) 71%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><g class=\"art-lights\"><rect x=\"63\" y=\"14\" width=\"97\" height=\"4\" rx=\"2\" fill=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke-width=\"1.5\"/></g><text x=\"298\" y=\"119\" text-anchor=\"end\" fill=\"color-mix(in srgb,var(--room-accent) 81%,#141414)\" font-family=\"Arial,sans-serif\" font-size=\"9.5\">Laundry room lighting</text></svg>"};
const PICTURE_NAMES = { auto: 'Match the room', kitchen: 'Kitchen', bedroom: 'Bedroom', bathroom: 'Bathroom', living_room: 'Living room', office: 'Office / computer room', hallway: 'Hallway', staircase: 'Staircase', outside: 'Outside / porch', laundry: 'Laundry room', none: 'No picture' };
const ICON_GUESS = [[/kitchen/,'mdi:stove'],[/bed/,'mdi:bed-king-outline'],[/bath|wash|powder|ensuite/,'mdi:shower'],[/living|family|lounge|great/,'mdi:sofa-outline'],[/office|computer|study|den/,'mdi:monitor-dashboard'],[/hall|entry|foyer/,'mdi:door-open'],[/stair/,'mdi:stairs'],[/out|porch|yard|garden|patio|deck|front|back/,'mdi:tree-outline'],[/laundry|utility|mud/,'mdi:washing-machine'],[/garage/,'mdi:garage'],[/dining/,'mdi:silverware-fork-knife'],[/basement/,'mdi:home-floor-b'],[/kid|nursery|play/,'mdi:teddy-bear']];
const PIC_GUESS = [[/kitchen/,'kitchen'],[/bed|nursery|kid/,'bedroom'],[/bath|wash|powder|ensuite/,'bathroom'],[/living|family|lounge|great|basement/,'living_room'],[/office|computer|study|den/,'office'],[/hall|entry|foyer/,'hallway'],[/stair/,'staircase'],[/out|porch|yard|garden|patio|deck|front|back|garage/,'outside'],[/laundry|utility|mud/,'laundry']];

const DEFAULTS = {
  picture: 'auto', tap: 'popup', hold: 'none',
  show_picture: true, show_icon: true, show_buttons: true, show_brightness: true, show_presets: true, show_wheel: true,
  card_spacing: 'standard', corners: 'rounded', title_size: 'medium',
  off_background: 'theme', on_glow: 'normal', follow_light_colour: true,
  button_size: 'large', button_shape: 'rounded', button_tint: 'soft',
  on_color: [35, 145, 86], off_color: [178, 52, 64], on_text: 'On', off_text: 'Off',
  on_icon: 'mdi:lightbulb-on', off_icon: 'mdi:lightbulb-off-outline',
  preset_1: '2000', preset_2: '3500', preset_3: '5000', preset_4: '6500',
  wake_brightness: 50,
  title_color: [247, 249, 252], hover_color: [184, 184, 184], off_custom_color: [40, 44, 52],
};
const PRESETS = { '2000': ['Candlelight', '#ff890e'], '2700': ['Warm white', '#ffa957'], '3000': ['Soft white', '#ffb46b'], '3500': ['Soft white', '#ffc18d'], '4000': ['Neutral white', '#ffd1a3'], '5000': ['Cool white', '#ffe4ce'], '6500': ['Daylight', '#fffefa'] };
const COLOUR_MODES = ['hs', 'xy', 'rgb', 'rgbw', 'rgbww'];
const NEUTRAL = [184, 184, 184];

/* ---------------- helpers ---------------- */
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const okRgb = v => Array.isArray(v) && v.length === 3 && v.every(n => Number.isFinite(+n));
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const esc = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const titleCase = s => String(s || '').replace(/_/g, ' ').replace(/\b\w/g, m => m.toUpperCase());
const live = st => st && !['unavailable', 'unknown'].includes(st.state);
const isOn = st => st && st.state === 'on';
const modesOf = st => st?.attributes?.supported_color_modes || [];
const dimmable = st => { const m = modesOf(st); return m.length ? m.some(x => x !== 'onoff') : st?.attributes?.brightness != null; };
const supportsTemp = st => modesOf(st).includes('color_temp') || st?.attributes?.min_color_temp_kelvin != null;
const supportsColour = st => modesOf(st).some(m => COLOUR_MODES.includes(m));
const isGroup = st => Array.isArray(st?.attributes?.entity_id);
function kelvinToRgb(k) {
  const t = Math.max(1000, Math.min(40000, k)) / 100; let r, g, b;
  if (t <= 66) { r = 255; g = 99.47 * Math.log(t) - 161.12; b = t <= 19 ? 0 : 138.52 * Math.log(t - 10) - 305.04; }
  else { r = 329.7 * Math.pow(t - 60, -0.1332); g = 288.12 * Math.pow(t - 60, -0.0755); b = 255; }
  return [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))));
}
function hsToRgb(h, s) {
  s /= 100; const f = n => { const k = (n + h / 60) % 6; return Math.round(255 * (1 - s * Math.max(0, Math.min(k, 4 - k, 1)))); };
  return [f(5), f(3), f(1)];
}
function lightRgb(st) {
  const a = st.attributes || {};
  if (a.color_mode === 'color_temp' && a.color_temp_kelvin) return kelvinToRgb(a.color_temp_kelvin);
  if (Array.isArray(a.rgb_color)) return a.rgb_color;
  if (Array.isArray(a.hs_color)) return hsToRgb(a.hs_color[0], a.hs_color[1]);
  if (a.color_temp_kelvin) return kelvinToRgb(a.color_temp_kelvin);
  return [255, 196, 120];
}

/* Find the room's lights from Home Assistant's own Area assignments. */
function roomLights(hass, cfg) {
  const out = new Set();
  const ents = hass.entities || {}, devs = hass.devices || {};
  const hide = new Set(cfg.hide_lights || []);
  if (cfg.area) for (const [id, e] of Object.entries(ents)) {
    if (!id.startsWith('light.')) continue;
    if (e.entity_category || /_segment_\d+$/.test(id)) continue;
    const area = e.area_id || devs[e.device_id]?.area_id;
    if (area !== cfg.area) continue;
    const st = hass.states[id];
    if (!st || isGroup(st)) continue;
    out.add(id);
  }
  for (const id of cfg.extra_lights || []) if (hass.states[id]) out.add(id);
  for (const id of hide) out.delete(id);
  return [...out].sort((a, b) => (hass.states[a]?.attributes?.friendly_name || a).localeCompare(hass.states[b]?.attributes?.friendly_name || b));
}
const onTargets = (hass, cfg, members) => (cfg.on_lights?.length ? cfg.on_lights : members).filter(id => live(hass.states[id]));

/* ---------------- styles ---------------- */
const CARD_CSS = `
:host{display:block;--osl-rgb:184,184,184}
ha-card{position:relative;overflow:hidden;padding:var(--osl-pad,18px);border-radius:var(--osl-radius,22px);box-sizing:border-box;
  background:linear-gradient(145deg,rgba(255,255,255,.08),rgba(255,255,255,.015)),var(--osl-off-bg);
  border:1px solid rgba(255,255,255,.12);box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 10px 24px rgba(0,0,0,.10);
  backdrop-filter:blur(18px) saturate(1.1);-webkit-backdrop-filter:blur(18px) saturate(1.1);color:#f7f9fc;cursor:pointer;
  -webkit-tap-highlight-color:transparent;user-select:none}
ha-card.on{background:linear-gradient(145deg,rgba(255,255,255,.16),rgba(255,255,255,.035) 48%,rgba(255,255,255,.075)),
  linear-gradient(rgba(var(--osl-rgb),var(--osl-glow-a,.25)),rgba(var(--osl-rgb),var(--osl-glow-b,.12))),rgba(28,28,28,.62);
  border-color:rgba(var(--osl-rgb),var(--osl-glow-border,.34));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.25),inset 0 -1px 0 rgba(255,255,255,.04),0 8px 24px rgba(0,0,0,.16);
  backdrop-filter:blur(12px) saturate(1.15);-webkit-backdrop-filter:blur(12px) saturate(1.15)}
.wrap{display:grid;grid-template-columns:auto minmax(0,1fr) auto;grid-template-areas:"i n p" "art art art" "m m m";column-gap:10px;row-gap:10px;align-items:center}
.icon{grid-area:i;width:44px;height:44px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:rgba(var(--osl-rgb),.10)}
.icon ha-icon{--mdc-icon-size:var(--osl-icon,34px);color:rgb(var(--osl-rgb))}
ha-card.on .icon ha-icon{animation:osl-breathe 3.2s ease-in-out infinite}
.name{grid-area:n;font-family:Arial,sans-serif;font-weight:650;letter-spacing:-.4px;font-size:var(--osl-title,21px);line-height:1.2;color:var(--osl-title-color,#f7f9fc);overflow-wrap:anywhere}
.power{grid-area:p;display:flex;gap:8px;width:clamp(156px,46%,250px);align-self:start}
.pbtn{all:unset;box-sizing:border-box;cursor:pointer;flex:1;min-width:0;height:var(--osl-btn,80px);border-radius:var(--osl-btn-radius,14px);
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;font:650 14px/18px Arial,sans-serif;color:#f7f9fc;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.1);transition:transform .12s ease,filter .12s ease}
.pbtn ha-icon{--mdc-icon-size:calc(var(--osl-btn,80px) * .42);color:#f5fff8}
.pbtn:active{transform:scale(.96)} .pbtn:focus-visible{outline:2px solid #fff;outline-offset:2px}
.pbtn.on{background:var(--osl-on-bg);border:1px solid var(--osl-on-border)} .pbtn.off{background:var(--osl-off-btn-bg);border:1px solid var(--osl-off-border)}
.pbtn[disabled]{opacity:.45;cursor:default}
.art{grid-area:art;height:112px;border-radius:15px;overflow:hidden;pointer-events:none;--room-accent:rgb(var(--osl-rgb));--art-light:rgba(var(--osl-rgb),.95);--art-line:rgba(var(--osl-rgb),.7)}
ha-card.on .art{background:rgba(var(--osl-rgb),.06)} ha-card.on .art .art-lights{animation:osl-art 3.6s ease-in-out infinite}
.art svg{display:block;width:100%;height:100%}
.master{grid-area:m;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));row-gap:10px;cursor:default}
.dim{grid-column:1/-1;display:flex;flex-direction:column;gap:4px}
.dimhead{display:flex;align-items:baseline;gap:7px;font:600 16px/20px Arial,sans-serif;color:#eef3fa}
.dimhead output{font-weight:650}
input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:56px;margin:0;background:transparent;cursor:pointer;touch-action:pan-y}
input[type=range]::-webkit-slider-runnable-track{height:12px;border-radius:6px;background:linear-gradient(90deg,rgba(var(--osl-rgb),.95) var(--pct,0%),rgba(255,255,255,.16) var(--pct,0%))}
input[type=range]::-moz-range-track{height:12px;border-radius:6px;background:rgba(255,255,255,.16)}
input[type=range]::-moz-range-progress{height:12px;border-radius:6px;background:rgba(var(--osl-rgb),.95)}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:32px;height:32px;border-radius:50%;margin-top:-10px;background:rgb(var(--osl-rgb));border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)}
input[type=range]::-moz-range-thumb{width:26px;height:26px;border-radius:50%;background:rgb(var(--osl-rgb));border:3px solid #fff}
input[type=range]:disabled{opacity:.45;cursor:default}
.chip{all:unset;box-sizing:border-box;justify-self:center;width:min(100%,60px);height:60px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer}
.chip span{width:40px;height:40px;border-radius:50%;box-shadow:0 0 0 1px rgba(255,255,255,.18),0 2px 6px rgba(0,0,0,.25)}
.chip:focus-visible{outline:2px solid #fff}
.chip.wheel span{width:40px;height:40px;border-radius:50%;background:conic-gradient(red,#ff0,lime,cyan,blue,#f0f,red)}
.chip:active{transform:scale(.95)} .chip[disabled]{opacity:.4;cursor:default}
.msg{grid-column:1/-1;font:13px/17px Arial,sans-serif;color:#ffd7d7;min-height:0}
.msg:empty{display:none}
@media (hover:hover) and (pointer:fine){ha-card:hover{border-color:var(--osl-hover,rgba(var(--osl-rgb),.7))}}
@media (max-width:767px){.art{display:none}}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
@media (prefers-reduced-transparency:reduce){ha-card{backdrop-filter:none;-webkit-backdrop-filter:none;background:rgb(48,48,48)}}
@keyframes osl-breathe{0%,100%{transform:scale(1);opacity:.84}50%{transform:scale(1.055);opacity:1}}
@keyframes osl-art{0%,100%{opacity:.82}50%{opacity:1}}
.hide{display:none!important}
`;

/* ---------------- the card ---------------- */
class OneStopRoomLightsCard extends HTMLElement {
  static getConfigElement() { return document.createElement(EDITOR_TAG); }
  static getStubConfig(hass) {
    const areas = Object.values(hass?.areas || {});
    const a = areas.find(x => /kitchen/i.test(x.name)) || areas[0];
    return a ? { area: a.area_id } : {};
  }
  setConfig(config) {
    if (!config) throw new Error('Invalid configuration');
    this._cfg = { ...DEFAULTS, ...config };
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this._built = false;
    if (this._hass) this._render();
  }
  set hass(hass) { this._hass = hass; if (!this._built) this._render(); else this._update(); this._popup?.update(hass); }
  get hass() { return this._hass; }
  getCardSize() { return 6; }
  getGridOptions() { return { columns: 12, rows: 'auto', min_columns: 6 }; }

  _areaName() { const a = this._hass?.areas?.[this._cfg.area]; return a?.name || titleCase(this._cfg.area); }
  _icon() {
    if (this._cfg.room_icon) return this._cfg.room_icon;
    const a = this._hass?.areas?.[this._cfg.area]; if (a?.icon) return a.icon;
    const key = (this._cfg.area + ' ' + (a?.name || '')).toLowerCase();
    return (ICON_GUESS.find(([re]) => re.test(key)) || [, 'mdi:lightbulb-group'])[1];
  }
  _picture() {
    let k = this._cfg.picture;
    if (k === 'auto') { const key = (this._cfg.area + ' ' + this._areaName()).toLowerCase(); k = (PIC_GUESS.find(([re]) => re.test(key)) || [, 'living_room'])[1]; }
    let svg = PICTURES[k] || '';
    if (svg && this._cfg.picture_caption != null) svg = svg.replace(/(<text[^>]*>)[^<]*(<\/text>)/, `$1${esc(this._cfg.picture_caption)}$2`);
    return svg;
  }

  _render() {
    const c = this._cfg, R = this.shadowRoot;
    if (!c.area) { R.innerHTML = `<ha-card style="padding:16px">Pick a room in the card editor.</ha-card>`; return; }
    const pad = { compact: '12px', standard: '18px', roomy: '24px' }[c.card_spacing] || '18px';
    const radius = { square: '8px', rounded: '22px', extra_round: '32px' }[c.corners] || '22px';
    const title = { small: '17px', medium: '21px', large: '24px', extra_large: '28px' }[c.title_size] || '21px';
    const btn = { small: '56px', medium: '68px', large: '80px', extra_large: '96px' }[c.button_size] || '80px';
    const bRad = { square: '6px', rounded: '14px', extra_round: '50%' }[c.button_shape] || '14px';
    const tint = { very_soft: [.28, .30], soft: [.44, .46], medium: [.60, .62], bold: [.80, .82] }[c.button_tint] || [.44, .46];
    const glow = { subtle: [.13, .06, .2], normal: [.25, .12, .34], strong: [.42, .24, .5] }[c.on_glow] || [.25, .12, .34];
    const onC = okRgb(c.on_color) ? c.on_color : DEFAULTS.on_color, offC = okRgb(c.off_color) ? c.off_color : DEFAULTS.off_color;
    const offBg = { theme: 'var(--bubble-button-main-background-color,var(--bubble-main-background-color,var(--background-color-2,var(--ha-card-background,var(--card-background-color,var(--secondary-background-color))))))', darker: 'rgba(14,16,21,.88)', lighter: 'rgba(84,90,102,.72)', custom: okRgb(c.off_custom_color) ? rgba(c.off_custom_color, .82) : 'var(--secondary-background-color)' }[c.off_background];
    const vars = [`--osl-pad:${pad}`, `--osl-radius:${radius}`, `--osl-title:${title}`, `--osl-btn:${btn}`, `--osl-btn-radius:${bRad}`,
      `--osl-on-bg:${rgba(onC, tint[0])}`, `--osl-on-border:${rgba(onC.map(v => Math.min(255, v + 60)), .7)}`,
      `--osl-off-btn-bg:${rgba(offC, tint[1])}`, `--osl-off-border:${rgba(offC.map(v => Math.min(255, v + 60)), .7)}`,
      `--osl-glow-a:${glow[0]}`, `--osl-glow-b:${glow[1]}`, `--osl-glow-border:${glow[2]}`, `--osl-off-bg:${offBg}`];
    if (okRgb(c.title_color) && !same(c.title_color, DEFAULTS.title_color)) vars.push(`--osl-title-color:${rgba(c.title_color, 1)}`);
    if (okRgb(c.hover_color) && !same(c.hover_color, DEFAULTS.hover_color)) vars.push(`--osl-hover:${rgba(c.hover_color, .8)}`);
    const presets = [c.preset_1, c.preset_2, c.preset_3, c.preset_4].map(k => String(k));
    const pic = c.show_picture ? this._picture() : '';
    R.innerHTML = `<style>${CARD_CSS}</style>
<ha-card style="${vars.join(';')}" role="button" tabindex="0" aria-label="${esc(this._title())} lights">
 <div class="wrap">
  <div class="icon ${c.show_icon ? '' : 'hide'}"><ha-icon></ha-icon></div>
  <div class="name"></div>
  <div class="power ${c.show_buttons ? '' : 'hide'}">
   <button class="pbtn on" data-act="on" aria-label="Turn ${esc(this._title())} lights on"><ha-icon icon="${esc(c.on_icon)}"></ha-icon><span>${esc(c.on_text)}</span></button>
   <button class="pbtn off" data-act="off" aria-label="Turn ${esc(this._title())} lights off"><ha-icon icon="${esc(c.off_icon)}"></ha-icon><span>${esc(c.off_text)}</span></button>
  </div>
  <div class="art ${pic ? '' : 'hide'}">${pic}</div>
  <div class="master ${c.show_brightness || c.show_presets || c.show_wheel ? '' : 'hide'}">
   <div class="dim ${c.show_brightness ? '' : 'hide'}"><div class="dimhead"><span>Brightness</span><output></output></div>
    <input type="range" min="0" max="100" step="1" aria-label="${esc(this._title())} brightness"></div>
   ${presets.map((k, i) => `<button class="chip preset ${c.show_presets ? '' : 'hide'}" data-k="${esc(k)}" title="${esc((PRESETS[k] || ['White'])[0])} · ${esc(k)} K" aria-label="${esc((PRESETS[k] || ['White'])[0])} ${esc(k)} kelvin"><span style="background:${(PRESETS[k] || [, '#ffe4ce'])[1]}"></span></button>`).join('')}
   <button class="chip wheel ${c.show_wheel ? '' : 'hide'}" title="More colours" aria-label="More colours"><span></span></button>
   <div class="msg" aria-live="polite"></div>
  </div>
 </div>
</ha-card>`;
    this._el = { card: R.querySelector('ha-card'), icon: R.querySelector('.icon ha-icon'), name: R.querySelector('.name'), range: R.querySelector('input[type=range]'), out: R.querySelector('output'), msg: R.querySelector('.msg'), on: R.querySelector('[data-act=on]'), off: R.querySelector('[data-act=off]') };
    this._wire();
    this._built = true;
    this._update();
  }
  _title() { return this._cfg.name || this._areaName(); }

  _wire() {
    const { card, range, on, off } = this._el;
    const stop = e => e.stopPropagation();
    for (const el of this.shadowRoot.querySelectorAll('.power, .master')) { el.addEventListener('click', stop); el.addEventListener('pointerdown', stop); }
    on.addEventListener('click', () => this._power(true));
    off.addEventListener('click', () => this._power(false));
    this.shadowRoot.querySelectorAll('.preset').forEach(b => b.addEventListener('click', () => this._applyColour({ color_temp_kelvin: +b.dataset.k })));
    this.shadowRoot.querySelector('.wheel').addEventListener('click', () => this._openColour());
    // live brightness while dragging (throttled), final value on release
    let last = 0, timer = null, sent = null;
    const send = () => { if (+range.value === sent) return; sent = +range.value; this._sendBrightness(sent); last = Date.now(); };
    range.addEventListener('pointerdown', () => { this._dragging = true; sent = null; });
    range.addEventListener('input', () => {
      this._dragging = true; this._paintRange(+range.value);
      clearTimeout(timer); const wait = 160 - (Date.now() - last);
      if (wait <= 0) send(); else timer = setTimeout(send, wait);
    });
    range.addEventListener('change', () => { clearTimeout(timer); send(); setTimeout(() => { this._dragging = false; }, 1200); });
    // tap / hold on the card body
    let holdTimer = null, held = false;
    card.addEventListener('pointerdown', e => { held = false; holdTimer = setTimeout(() => { held = true; this._action(this._cfg.hold, this._cfg.hold_page); }, 550); });
    const cancel = () => clearTimeout(holdTimer);
    card.addEventListener('pointerup', cancel); card.addEventListener('pointerleave', cancel); card.addEventListener('pointercancel', cancel);
    card.addEventListener('click', () => { if (held) { held = false; return; } this._action(this._cfg.tap, this._cfg.tap_page); });
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._action(this._cfg.tap, this._cfg.tap_page); } });
  }
  _action(kind, page) {
    if (kind === 'popup') return this._openPopup();
    if (kind === 'page' && page) { history.pushState(null, '', page); window.dispatchEvent(new CustomEvent('location-changed', { detail: { replace: false } })); }
  }

  _update() {
    const h = this._hass, c = this._cfg; if (!h || !this._el) return;
    const members = roomLights(h, c);
    this._members = members;
    const states = members.map(id => h.states[id]).filter(Boolean);
    const onStates = states.filter(isOn);
    const active = onStates.length > 0;
    // live room colour (brightness-weighted)
    let rgb = NEUTRAL;
    if (active && c.follow_light_colour !== false) {
      let w = 0, acc = [0, 0, 0];
      for (const st of onStates) { const b = (st.attributes.brightness ?? 255) / 255 + .05, col = lightRgb(st); acc = acc.map((v, i) => v + col[i] * b); w += b; }
      rgb = acc.map(v => Math.round(v / w));
    } else if (active) rgb = [255, 196, 120];
    this._el.card.style.setProperty('--osl-rgb', rgb.join(','));
    this._el.card.classList.toggle('on', active);
    this._el.icon.setAttribute('icon', this._icon());
    this._el.name.textContent = this._title();
    const targets = onTargets(h, c, members);
    this._el.on.disabled = !targets.length;
    this._el.off.disabled = !states.some(live);
    // brightness
    const dimOn = onStates.filter(dimmable);
    const pct = dimOn.length ? Math.round(dimOn.reduce((s, st) => s + (st.attributes.brightness || 0), 0) / dimOn.length / 2.55) : 0;
    if (!this._dragging) { this._el.range.value = pct; this._paintRange(pct); }
    this._el.range.disabled = !states.some(st => live(st) && dimmable(st));
    const tempOk = states.some(st => live(st) && supportsTemp(st)), colOk = states.some(st => live(st) && supportsColour(st));
    this.shadowRoot.querySelectorAll('.preset').forEach(b => { b.disabled = !tempOk; });
    this.shadowRoot.querySelector('.wheel').disabled = !(colOk || tempOk);
  }
  _paintRange(v) { this._el.range.style.setProperty('--pct', v + '%'); this._el.out.textContent = v + '%'; }
  _say(text) { this._el.msg.textContent = text || ''; if (text) setTimeout(() => { if (this._el.msg.textContent === text) this._el.msg.textContent = ''; }, 5000); }
  async _call(domain, service, data) {
    try { await this._hass.callService(domain, service, data); }
    catch (e) { this._say(e?.message || 'Couldn’t reach the lights'); }
  }

  _power(turnOn) {
    const h = this._hass, c = this._cfg, members = roomLights(h, c);
    if (turnOn) { const t = onTargets(h, c, members); if (t.length) this._call('light', 'turn_on', { entity_id: t }); }
    else { const t = members.filter(id => live(h.states[id])); if (t.length) this._call('homeassistant', 'turn_off', { entity_id: t }); }
  }
  _sendBrightness(v) {
    const h = this._hass, c = this._cfg, members = roomLights(h, c);
    const onNow = members.filter(id => isOn(h.states[id]) && dimmable(h.states[id]));
    if (v <= 0) { const t = onNow.length ? onNow : []; if (t.length) this._call('light', 'turn_off', { entity_id: t }); return; }
    const t = onNow.length ? onNow : onTargets(h, c, members).filter(id => dimmable(h.states[id]));
    if (t.length) this._call('light', 'turn_on', { entity_id: t, brightness_pct: v });
  }
  /* Colour rule: if any room light is on, change only the lights that are on (keep their brightness).
     If everything is off, turn on the "On button" lights at the wake-up brightness. */
  _applyColour(data) {
    const h = this._hass, c = this._cfg, members = roomLights(h, c);
    const anyOn = members.some(id => isOn(h.states[id]));
    let targets = anyOn ? members.filter(id => isOn(h.states[id])) : onTargets(h, c, members);
    const wantsTemp = 'color_temp_kelvin' in data;
    targets = targets.filter(id => { const st = h.states[id]; return live(st) && (wantsTemp ? supportsTemp(st) : supportsColour(st)); });
    if (!targets.length) { this._say(anyOn ? 'None of the lights that are on can do that colour.' : 'No lights here can do that colour.'); return; }
    for (const id of targets) {
      const st = h.states[id], d = { entity_id: id, ...data };
      if (wantsTemp) { const lo = st.attributes.min_color_temp_kelvin || 2000, hi = st.attributes.max_color_temp_kelvin || 6500; d.color_temp_kelvin = Math.max(lo, Math.min(hi, data.color_temp_kelvin)); }
      if (!anyOn) d.brightness_pct = +c.wake_brightness || 50;
      this._call('light', 'turn_on', d);
    }
  }
  _openColour() { this._ensurePopup().open('colour'); }
  _openPopup() { this._ensurePopup().open('lights'); }
  _ensurePopup() {
    if (!this._popup) { this._popup = document.createElement(POPUP_TAG); this._popup.card = this; }
    if (!this._popup.isConnected) document.body.appendChild(this._popup);
    this._popup.update(this._hass);
    return this._popup;
  }
  disconnectedCallback() { this._popup?.close(); }
}

/* ---------------- pop-up: individual lights + colour picker ---------------- */
const POP_CSS = `
:host{position:fixed;inset:0;z-index:9999;display:none;font-family:var(--paper-font-body1_-_font-family,Arial,sans-serif)}
:host([open]){display:block}
.back{position:absolute;inset:0;background:rgba(0,0,0,.45);backdrop-filter:blur(2px)}
.sheet{position:absolute;left:50%;bottom:0;transform:translateX(-50%);width:min(620px,100%);max-height:86vh;overflow:auto;box-sizing:border-box;padding:18px 16px calc(18px + env(safe-area-inset-bottom,0px));
  border-radius:28px 28px 0 0;background:linear-gradient(rgba(var(--osl-rgb),.18),rgba(var(--osl-rgb),.08)),var(--card-background-color,#1c1c1c);color:var(--primary-text-color,#f7f9fc);box-shadow:0 -10px 40px rgba(0,0,0,.4);animation:up .22s ease-out}
@media(min-width:768px){.sheet{bottom:auto;top:8vh;border-radius:28px}}
@keyframes up{from{transform:translate(-50%,24px);opacity:0}to{transform:translate(-50%,0);opacity:1}}
header{display:flex;align-items:center;gap:12px;margin-bottom:14px}
header h2{flex:1;margin:0;font:650 21px/25px Arial,sans-serif;letter-spacing:-.4px}
.x{all:unset;cursor:pointer;width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.08)}
.row{position:relative;display:flex;align-items:center;gap:12px;min-height:76px;margin-bottom:8px;padding:0 14px;border-radius:24px;overflow:hidden;cursor:pointer;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08)}
.row .fill{position:absolute;inset:0 auto 0 0;width:0;background:rgba(var(--c),.45);pointer-events:none;transition:width .15s}
.row .ic{position:relative;z-index:1;width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.1);cursor:pointer}
.row.on .ic{background:rgba(var(--c),.9);color:#111}
.row .tx{position:relative;z-index:1;flex:1;min-width:0}
.row .nm{font:600 18px/22px Arial,sans-serif;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.row .stt{font:16px/20px Arial,sans-serif;opacity:.78}
.row input{position:absolute;inset:0;width:100%;height:100%;opacity:0;margin:0;cursor:ew-resize;z-index:0;touch-action:pan-y}
.empty{opacity:.7;padding:20px 4px}
.wheelbox{display:flex;flex-direction:column;align-items:center;gap:16px;padding:6px 0 10px}
.wheel{width:260px;height:260px;border-radius:50%;cursor:crosshair;touch-action:none;position:relative;background:radial-gradient(circle,#fff 0,rgba(255,255,255,0) 70%),conic-gradient(from 90deg,red,#ff0,lime,cyan,blue,#f0f,red)}
.temps{display:grid;grid-template-columns:repeat(7,1fr);gap:8px;width:100%}
.temps button{all:unset;cursor:pointer;height:48px;border-radius:14px;border:1px solid rgba(255,255,255,.14)}
.note{font:13px/17px Arial,sans-serif;opacity:.75;text-align:center}
`;
class OneStopRoomLightsPopup extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: 'open' }); this._onKey = e => { if (e.key === 'Escape') this.close(); }; }
  open(mode) { this._mode = mode; this.setAttribute('open', ''); this._build(); document.addEventListener('keydown', this._onKey); }
  close() { this.removeAttribute('open'); document.removeEventListener('keydown', this._onKey); }
  update(hass) { this._hass = hass; if (this.hasAttribute('open') && this._mode === 'lights') this._refresh(); }
  _build() {
    const card = this.card, title = card._title();
    this.style.setProperty('--osl-rgb', card._el.card.style.getPropertyValue('--osl-rgb') || '184,184,184');
    this.shadowRoot.innerHTML = `<style>${POP_CSS}</style><div class="back"></div><div class="sheet" role="dialog" aria-label="${esc(title)}">
      <header><h2>${esc(this._mode === 'colour' ? title + ' colour' : title)}</h2><button class="x" aria-label="Close"><ha-icon icon="mdi:close"></ha-icon></button></header><div class="body"></div></div>`;
    this.shadowRoot.querySelector('.back').onclick = () => this.close();
    this.shadowRoot.querySelector('.x').onclick = () => this.close();
    this._body = this.shadowRoot.querySelector('.body');
    this._rows = {};
    if (this._mode === 'colour') this._buildColour(); else this._refresh();
  }
  _refresh() {
    const h = this._hass, card = this.card; if (!h || !this._body) return;
    const ids = roomLights(h, card._cfg);
    if (!ids.length) { this._body.innerHTML = `<div class="empty">No lights are assigned to this room yet. Assign lights to the room in Home Assistant, or add them under “Extra lights” in the card editor.</div>`; this._rows = {}; return; }
    if (Object.keys(this._rows).join() !== ids.join()) {
      this._body.innerHTML = ''; this._rows = {};
      for (const id of ids) {
        const row = document.createElement('div'); row.className = 'row';
        row.innerHTML = `<div class="fill"></div><input type="range" min="1" max="100" aria-label="Brightness"><div class="ic" role="button" aria-label="More settings"><ha-icon></ha-icon></div><div class="tx"><div class="nm"></div><div class="stt"></div></div>`;
        const input = row.querySelector('input'); let moved = false, t = null, last = 0;
        input.addEventListener('pointerdown', () => { moved = false; row._drag = true; });
        input.addEventListener('input', () => { moved = true; row.querySelector('.fill').style.width = input.value + '%'; clearTimeout(t);
          const go = () => { last = Date.now(); card._call('light', 'turn_on', { entity_id: id, brightness_pct: +input.value }); };
          const wait = 160 - (Date.now() - last); if (wait <= 0) go(); else t = setTimeout(go, wait); });
        input.addEventListener('change', () => { clearTimeout(t); if (moved) card._call('light', 'turn_on', { entity_id: id, brightness_pct: +input.value }); setTimeout(() => { row._drag = false; }, 1000); });
        input.addEventListener('click', () => { if (!moved) card._call('homeassistant', 'toggle', { entity_id: id }); moved = false; });
        row.querySelector('.ic').addEventListener('click', e => { e.stopPropagation(); this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: id }, bubbles: true, composed: true })); });
        this._body.appendChild(row); this._rows[id] = row;
      }
    }
    for (const id of ids) {
      const st = h.states[id], row = this._rows[id]; if (!st) continue;
      const on = isOn(st), pct = on ? Math.max(1, Math.round((st.attributes.brightness ?? 255) / 2.55)) : 0;
      const col = on ? lightRgb(st) : [140, 140, 140];
      row.classList.toggle('on', on); row.style.setProperty('--c', col.join(','));
      row.querySelector('.ic ha-icon').setAttribute('icon', st.attributes.icon || (on ? 'mdi:lightbulb-on' : 'mdi:lightbulb-outline'));
      row.querySelector('.nm').textContent = st.attributes.friendly_name || id;
      row.querySelector('.stt').textContent = !live(st) ? 'Not responding' : on ? (dimmable(st) ? pct + '%' : 'On') : 'Off';
      const input = row.querySelector('input'); input.disabled = !live(st);
      if (!row._drag) { input.value = pct || 1; row.querySelector('.fill').style.width = pct + '%'; }
    }
  }
  _buildColour() {
    const card = this.card;
    const temps = [2000, 2700, 3000, 3500, 4000, 5000, 6500];
    this._body.innerHTML = `<div class="wheelbox"><div class="wheel" role="slider" aria-label="Colour wheel"></div>
      <div class="temps">${temps.map(k => `<button data-k="${k}" title="${k} K" style="background:${rgba(kelvinToRgb(k), 1)}"></button>`).join('')}</div>
      <div class="note">If any lights are on, only those change. If they’re all off, the room turns on at ${+card._cfg.wake_brightness || 50}%.</div></div>`;
    const wheel = this._body.querySelector('.wheel');
    const pick = e => { const r = wheel.getBoundingClientRect(), x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
      const d = Math.min(1, Math.hypot(x, y) / (r.width / 2)); let hue = Math.atan2(y, x) * 180 / Math.PI; hue = (hue + 360) % 360;
      return [Math.round(hue), Math.round(d * 100)]; };
    let down = false, last = 0;
    wheel.addEventListener('pointerdown', e => { down = true; wheel.setPointerCapture(e.pointerId); });
    wheel.addEventListener('pointermove', e => { if (!down || Date.now() - last < 200) return; last = Date.now(); card._applyColour({ hs_color: pick(e) }); });
    wheel.addEventListener('pointerup', e => { down = false; card._applyColour({ hs_color: pick(e) }); });
    this._body.querySelectorAll('.temps button').forEach(b => b.addEventListener('click', () => card._applyColour({ color_temp_kelvin: +b.dataset.k })));
  }
}

/* ---------------- visual editor ---------------- */
const sel = opts => ({ select: { mode: 'dropdown', options: opts.map(([value, label]) => ({ value, label })) } });
const toggle = { boolean: {} };
const presetChoices = sel(Object.entries(PRESETS).map(([k, [n]]) => [k, `${n} (${k} K)`]));
const schema = d => [
  { name: 'area', required: true, selector: { area: {} } },
  { name: 'name', selector: { text: {} } },
  { name: 'room_icon', selector: { icon: {} } },
  { name: 'g_lights', type: 'expandable', flatten: true, title: 'Which lights', icon: 'mdi:lightbulb-group-outline', schema: [
    { name: 'on_lights', selector: { entity: { multiple: true, filter: { domain: 'light' } } } },
    { name: 'extra_lights', selector: { entity: { multiple: true, filter: { domain: 'light' } } } },
    { name: 'hide_lights', selector: { entity: { multiple: true, filter: { domain: 'light' } } } },
    { name: 'wake_brightness', selector: { number: { min: 5, max: 100, step: 5, mode: 'slider', unit_of_measurement: '%' } } },
  ] },
  { name: 'g_show', type: 'expandable', flatten: true, title: 'What to show', icon: 'mdi:eye-outline', schema: [
    { type: 'grid', name: '', flatten: true, schema: [
      { name: 'show_icon', selector: toggle }, { name: 'show_buttons', selector: toggle },
      { name: 'show_picture', selector: toggle }, { name: 'show_brightness', selector: toggle },
      { name: 'show_presets', selector: toggle }, { name: 'show_wheel', selector: toggle },
    ] },
    ...(d.show_picture ? [{ name: 'picture', selector: sel(Object.entries(PICTURE_NAMES).filter(([k]) => k !== 'none')) }, { name: 'picture_caption', selector: { text: {} } }] : []),
  ] },
  { name: 'g_look', type: 'expandable', flatten: true, title: 'Look and size', icon: 'mdi:palette-outline', schema: [
    { type: 'grid', name: '', flatten: true, schema: [
      { name: 'card_spacing', selector: sel([['compact', 'Compact'], ['standard', 'Standard'], ['roomy', 'Roomy']]) },
      { name: 'corners', selector: sel([['square', 'Square'], ['rounded', 'Rounded'], ['extra_round', 'Extra round']]) },
      { name: 'title_size', selector: sel([['small', 'Small'], ['medium', 'Medium'], ['large', 'Large'], ['extra_large', 'Extra large']]) },
      { name: 'title_color', selector: { color_rgb: {} } },
      { name: 'off_background', selector: sel([['theme', 'Match my other cards'], ['darker', 'Darker'], ['lighter', 'Lighter'], ['custom', 'My own colour']]) },
      ...(d.off_background === 'custom' ? [{ name: 'off_custom_color', selector: { color_rgb: {} } }] : []),
      { name: 'on_glow', selector: sel([['subtle', 'Subtle'], ['normal', 'Normal'], ['strong', 'Strong']]) },
      { name: 'follow_light_colour', selector: toggle },
      { name: 'hover_color', selector: { color_rgb: {} } },
    ] },
  ] },
  { name: 'g_buttons', type: 'expandable', flatten: true, title: 'On and Off buttons', icon: 'mdi:gesture-tap-button', schema: [
    { type: 'grid', name: '', flatten: true, schema: [
      { name: 'button_size', selector: sel([['small', 'Small'], ['medium', 'Medium'], ['large', 'Large'], ['extra_large', 'Extra large']]) },
      { name: 'button_shape', selector: sel([['square', 'Square corners'], ['rounded', 'Rounded'], ['extra_round', 'Circle']]) },
      { name: 'button_tint', selector: sel([['very_soft', 'Very soft'], ['soft', 'Soft'], ['medium', 'Medium'], ['bold', 'Bold']]) },
      { name: 'on_color', selector: { color_rgb: {} } }, { name: 'off_color', selector: { color_rgb: {} } },
      { name: 'on_text', selector: { text: {} } }, { name: 'off_text', selector: { text: {} } },
      { name: 'on_icon', selector: { icon: {} } }, { name: 'off_icon', selector: { icon: {} } },
    ] },
  ] },
  { name: 'g_presets', type: 'expandable', flatten: true, title: 'White light buttons', icon: 'mdi:white-balance-sunny', schema: [
    { type: 'grid', name: '', flatten: true, schema: [
      { name: 'preset_1', selector: presetChoices }, { name: 'preset_2', selector: presetChoices },
      { name: 'preset_3', selector: presetChoices }, { name: 'preset_4', selector: presetChoices },
    ] },
  ] },
  { name: 'g_actions', type: 'expandable', flatten: true, title: 'Tap and hold', icon: 'mdi:gesture-tap', schema: [
    { name: 'tap', selector: sel([['popup', 'Show each light in a pop-up'], ['page', 'Go to a page'], ['none', 'Do nothing']]) },
    ...(d.tap === 'page' ? [{ name: 'tap_page', selector: { navigation: {} } }] : []),
    { name: 'hold', selector: sel([['popup', 'Show each light in a pop-up'], ['page', 'Go to a page'], ['none', 'Do nothing']]) },
    ...(d.hold === 'page' ? [{ name: 'hold_page', selector: { navigation: {} } }] : []),
  ] },
];
const LABELS = {
  area: 'Room', name: 'Card title (leave empty to use the room name)', room_icon: 'Room icon',
  on_lights: 'Lights the On button turns on (empty = all lights in the room)', extra_lights: 'Add lights from other rooms', hide_lights: 'Leave these lights out',
  wake_brightness: 'Brightness when a colour turns the room on',
  show_icon: 'Room icon', show_buttons: 'On / Off buttons', show_picture: 'Room picture (tablets & computers)', show_brightness: 'Brightness slider', show_presets: 'White light buttons', show_wheel: 'Colour button',
  picture: 'Picture', picture_caption: 'Words on the picture',
  card_spacing: 'Spacing inside the card', corners: 'Card corners', title_size: 'Title size', title_color: 'Title colour',
  off_background: 'Background when the lights are off', off_custom_color: 'Your background colour', on_glow: 'Glow when the lights are on', follow_light_colour: 'Glow matches the light colour',
  hover_color: 'Edge colour on mouse-over (grey = follow the lights)',
  button_size: 'Button size', button_shape: 'Button shape', button_tint: 'Button colour strength',
  on_color: 'On button colour', off_color: 'Off button colour', on_text: 'On button words', off_text: 'Off button words', on_icon: 'On button icon', off_icon: 'Off button icon',
  preset_1: 'Button 1', preset_2: 'Button 2', preset_3: 'Button 3', preset_4: 'Button 4',
  tap: 'When you tap the card', tap_page: 'Page to open on tap', hold: 'When you press and hold', hold_page: 'Page to open on hold',
};
const HELPERS = {
  on_lights: 'Tip: choose the room’s light group here so everything turns on together.',
  hide_lights: 'Hidden lights stay out of the pop-up, the colour glow and the buttons.',
  picture_caption: 'Leave empty to keep the standard wording.',
};

class OneStopRoomLightsCardEditor extends HTMLElement {
  setConfig(config) { this._config = { ...config }; this._render(); }
  set hass(hass) { this._hass = hass; this._render(); }
  _render() {
    if (!this._config) return;
    if (!this._form) {
      this._form = document.createElement('ha-form');
      this._form.computeLabel = s => LABELS[s.name] ?? s.title ?? s.name;
      this._form.computeHelper = s => HELPERS[s.name];
      this._form.addEventListener('value-changed', ev => {
        ev.stopPropagation();
        const v = ev.detail.value, out = { type: this._config.type || 'custom:' + TAG };
        for (const [k, val] of Object.entries(v)) {
          if (k === 'type' || val === '' || val == null) continue;
          if (Array.isArray(val) && !val.length && !okRgb(val)) continue;
          if (k in DEFAULTS && same(val, DEFAULTS[k])) continue;          // keep the saved settings short
          if (k === 'off_custom_color' && v.off_background !== 'custom') continue;
          if (k === 'tap_page' && v.tap !== 'page') continue;
          if (k === 'hold_page' && v.hold !== 'page') continue;
          out[k] = val;
        }
        this._config = out; this._render();
        this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: out }, bubbles: true, composed: true }));
      });
      this.appendChild(this._form);
    }
    const data = { ...DEFAULTS, ...this._config };
    this._form.hass = this._hass;
    this._form.schema = schema(data);
    this._form.data = data;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, OneStopRoomLightsCard);
if (!customElements.get(EDITOR_TAG)) customElements.define(EDITOR_TAG, OneStopRoomLightsCardEditor);
if (!customElements.get(POPUP_TAG)) customElements.define(POPUP_TAG, OneStopRoomLightsPopup);
window.customCards = window.customCards || [];
if (!window.customCards.some(c => c.type === TAG)) window.customCards.push({ type: TAG, name: 'One Stop - Room Lights card', description: 'A room’s lights in one card: On/Off, brightness, white light, colour and every light in a pop-up.', preview: true });
console.info(`%c ONE STOP %c Room Lights card ${VERSION} `, 'background:#375374;color:#fff;border-radius:3px 0 0 3px;padding:2px 4px', 'background:#e9eef5;color:#375374;border-radius:0 3px 3px 0;padding:2px 4px');
window.__oneStopRoomLights = { roomLights, kelvinToRgb, DEFAULTS, VERSION };
})();
