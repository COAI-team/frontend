import {ParagraphPropTypes, StrongPropTypes} from "../../utils/propTypes";

export function Strong({children}) {
  return <strong className="font-bold">{children}</strong>;
}

export function Paragraph({children}) {
  return <p className="mb-1">{children}</p>;
}

Strong.propTypes = StrongPropTypes;
Paragraph.propTypes = ParagraphPropTypes;
