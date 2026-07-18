from argparse import ArgumentParser
from pathlib import Path

from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
)


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = (
    ROOT / "output" / "pdf" / "Joao-Victor-Dias-Machado_CV-Audiovisual.pdf"
)

BLACK = HexColor("#181818")
BODY = HexColor("#3D3A3A")
MUTED = HexColor("#777170")
MAGENTA = HexColor("#C60068")
CYAN = HexColor("#00A9B7")
RULE = HexColor("#D8D0CC")
PAPER = HexColor("#FBFAF8")


def register_fonts():
    fonts = Path("C:/Windows/Fonts")
    pdfmetrics.registerFont(TTFont("SegoeUI", str(fonts / "segoeui.ttf")))
    pdfmetrics.registerFont(TTFont("SegoeUIBold", str(fonts / "segoeuib.ttf")))
    pdfmetrics.registerFont(TTFont("SegoeUIItalic", str(fonts / "segoeuii.ttf")))
    pdfmetrics.registerFont(TTFont("GeorgiaBold", str(fonts / "georgiab.ttf")))
    pdfmetrics.registerFontFamily(
        "SegoeUI",
        normal="SegoeUI",
        bold="SegoeUIBold",
        italic="SegoeUIItalic",
        boldItalic="SegoeUIBold",
    )


def style(name, **kwargs):
    defaults = dict(
        fontName="SegoeUI",
        fontSize=8.5,
        leading=10.6,
        textColor=BODY,
        alignment=TA_LEFT,
        spaceAfter=0,
    )
    defaults.update(kwargs)
    return ParagraphStyle(name, **defaults)


STYLES = {
    "name": style(
        "Name",
        fontName="GeorgiaBold",
        fontSize=21.5,
        leading=23.5,
        textColor=BLACK,
        spaceAfter=1.2,
    ),
    "role": style(
        "Role",
        fontName="SegoeUIBold",
        fontSize=9.8,
        leading=11.6,
        textColor=MAGENTA,
        spaceAfter=0.4,
    ),
    "focus": style(
        "Focus",
        fontSize=8.7,
        leading=10.4,
        textColor=BLACK,
        spaceAfter=1.8,
    ),
    "contact": style(
        "Contact",
        fontSize=8.15,
        leading=10,
        textColor=MUTED,
        spaceAfter=0.2,
    ),
    "summary": style(
        "Summary",
        fontSize=9,
        leading=11.5,
        textColor=BODY,
        spaceAfter=1.2,
    ),
    "entry_title": style(
        "EntryTitle",
        fontName="SegoeUIBold",
        fontSize=8.9,
        leading=10.7,
        textColor=BLACK,
        spaceAfter=0.5,
    ),
    "entry_body": style(
        "EntryBody",
        fontSize=8.55,
        leading=10.8,
        textColor=BODY,
    ),
    "education": style(
        "Education",
        fontSize=8.5,
        leading=10.4,
        textColor=BODY,
    ),
    "skill": style(
        "Skill",
        fontSize=8.35,
        leading=10.3,
        textColor=BODY,
    ),
}


def section(title):
    heading = Paragraph(
        title,
        style(
            f"Section-{title}",
            fontName="SegoeUIBold",
            fontSize=8.4,
            leading=9.7,
            textColor=MAGENTA,
            spaceBefore=4.5,
            spaceAfter=1.5,
        ),
    )
    rule = HRFlowable(
        width="100%",
        thickness=0.55,
        color=RULE,
        spaceBefore=0,
        spaceAfter=3.4,
    )
    return [heading, rule]


def entry(title, body, after=3.7):
    return KeepTogether(
        [
            Paragraph(title, STYLES["entry_title"]),
            Paragraph(body, STYLES["entry_body"]),
            Spacer(1, after),
        ]
    )


def draw_page(canvas, _doc):
    width, height = A4
    canvas.saveState()
    canvas.setFillColor(PAPER)
    canvas.rect(0, 0, width, height, fill=1, stroke=0)

    canvas.setFillColor(MAGENTA)
    canvas.rect(42.5, 37, 3.4, height - 74, fill=1, stroke=0)
    canvas.setFillColor(CYAN)
    canvas.rect(45.9, height - 118, 2.1, 33, fill=1, stroke=0)

    canvas.setStrokeColor(RULE)
    canvas.setLineWidth(0.55)
    canvas.line(53.5, 30.5, width - 42.5, 30.5)
    canvas.setFont("SegoeUI", 6.4)
    canvas.setFillColor(MUTED)
    canvas.drawString(53.5, 19.5, "J. V. Dias | Currículo audiovisual")
    canvas.drawRightString(width - 42.5, 19.5, "São Paulo | 2026")

    canvas.setTitle("João Victor Dias Machado - Currículo Audiovisual")
    canvas.setAuthor("João Victor Dias Machado")
    canvas.setSubject("Currículo para oportunidades em cinema e audiovisual")
    canvas.setKeywords(
        "audiovisual, cinema, assistência de direção, fotografia, câmera, "
        "iluminação, produção"
    )
    canvas.restoreState()


def build(output):
    register_fonts()
    output.parent.mkdir(parents=True, exist_ok=True)

    doc = SimpleDocTemplate(
        str(output),
        pagesize=A4,
        leftMargin=21 * mm,
        rightMargin=15 * mm,
        topMargin=13.5 * mm,
        bottomMargin=18 * mm,
        title="João Victor Dias Machado - Currículo Audiovisual",
        author="João Victor Dias Machado",
        subject="Currículo para oportunidades em cinema e audiovisual",
    )

    story = [
        Paragraph("JOÃO VICTOR DIAS MACHADO", STYLES["name"]),
        Paragraph("J. V. DIAS | PROFISSIONAL AUDIOVISUAL", STYLES["role"]),
        Paragraph(
            "ASSISTÊNCIA DE DIREÇÃO | CÂMERA E ILUMINAÇÃO | PRODUÇÃO DE SET",
            STYLES["focus"],
        ),
        Paragraph(
            'São Paulo, SP | <link href="tel:+5511958060696" color="#777170">+55 (11) 95806-0696</link> | '
            '<link href="mailto:joaodias@jvdias.com" color="#C60068">joaodias@jvdias.com</link>',
            STYLES["contact"],
        ),
        Paragraph(
            '<link href="https://jvdiasfilms.com.br" color="#C60068">jvdiasfilms.com.br</link> | '
            '<link href="https://www.linkedin.com/in/JvDiasM" color="#C60068">linkedin.com/in/JvDiasM</link> | '
            '<link href="https://www.instagram.com/jvdiasfilms" color="#C60068">instagram.com/jvdiasfilms</link>',
            STYLES["contact"],
        ),
        *section("RESUMO PROFISSIONAL"),
        Paragraph(
            "Profissional audiovisual e estudante de Cinema e Audiovisual, com experiência em assistência de direção, "
            "direção de fotografia, câmera, iluminação e assistência de produção e set. Créditos incluem um documentário "
            "lançado pela Farol Filmes, uma série documental da AMB Digital e branded content com Ana Maria Braga. "
            "Atua também com logística de equipamentos, monitor de direção, teleprompter, organização de mídia e pós-produção.",
            STYLES["summary"],
        ),
        *section("CRÉDITOS AUDIOVISUAIS SELECIONADOS"),
        entry(
            '2026 | ASSISTENTE DE DIREÇÃO, PRODUTOR ASSISTENTE, CÂMERA E FOTOGRAFIA | '
            '<link href="https://jvdiasfilms.com.br/projects/versao-brasileira" color="#181818">VERSÃO BRASILEIRA</link>',
            "Assistência de direção e direção de fotografia no documentário de 6 minutos sobre dublagem brasileira, "
            "com atuação também como produtor assistente e operador de câmera. Concepção da identidade visual e criação "
            "do trailer 3D. Publicado pela Farol Filmes em jun. 2026.",
            after=3.3,
        ),
        entry(
            '2026 | ASSISTÊNCIA GERAL | '
            '<link href="https://jvdiasfilms.com.br/projects/aprendi-vivendo" color="#181818">APRENDI VIVENDO</link> | Série documental | AMB Digital',
            "Cinco diárias que geraram material para uma série de cinco episódios com Ana Maria Braga, em equipe de cerca de dez "
            "profissionais. Apoio direto à direção e produção na logística e conferência de equipamentos, preparação de set, montagem "
            "de câmera e iluminação, operação do monitor de direção, controle de baterias e organização das mídias gravadas.",
            after=3.3,
        ),
        entry(
            '2026 | CÂMERA E DIREÇÃO DE FOTOGRAFIA | '
            '<link href="https://jvdiasfilms.com.br/projects/coelho-vermelho" color="#181818">COELHO VERMELHO</link> | Curta-metragem',
            "Operação da Sony A6400, direção de fotografia, montagem de iluminação, maquinaria e decupagem em produção concluída em duas horas.",
            after=3.3,
        ),
        entry(
            '2025 | ASSISTÊNCIA DE PRODUÇÃO, CÂMERA, TELEPROMPTER E PÓS | '
            '<link href="https://jvdiasfilms.com.br/projects/ana-maria-braga" color="#181818">ANA MARIA BRAGA &amp; FRUTAP</link>',
            "Montagem de iluminação Godox, operação de Sony A6400 e teleprompter, apoio logístico, tratamento de imagem, legendagem e preparação do conteúdo para publicação.",
            after=1.4,
        ),
        *section("EXPERIÊNCIA PROFISSIONAL"),
        entry(
            "ASSISTENTE DE MÍDIAS | Projeto Ana Maria Braga | Freelancer/PJ | mar. 2025 - jan. 2026",
            "Administração e produção de conteúdo para Facebook, Instagram, TikTok e X/Twitter; apoio à estratégia de campanhas e anúncios e coordenação de fluxos com equipes de mídia.",
            after=3.0,
        ),
        entry(
            "PRODUTOR | Digital Firewood | abr. 2024 - mar. 2025",
            "Marketing de Breach the Abyss e Electrifye, materiais de pitch, contato com publishers, organização de showcases e representação do estúdio no CNE Gaming Garage e XP. Participação em apresentações, reuniões e abertura de conversas para futuras parcerias.",
            after=3.0,
        ),
        entry(
            "PEER TUTOR | Centennial College | Toronto, Canadá | ago. 2023 - ago. 2024",
            "Tutoria individual para estudantes de Game Development, com suporte técnico, orientação de pipeline, resolução de problemas e acompanhamento de projetos.",
            after=1.0,
        ),
        *section("PROJETO APLICADO AO AUDIOVISUAL"),
        entry(
            '<link href="https://jvdiasfilms.com.br/teleprompter" color="#181818">TELEPROMPTER JVDIAS</link> | Criador e publisher | Windows / Microsoft Store',
            "Conceito, experiência de uso, design, desenvolvimento, testes, publicação e manutenção de aplicativo gratuito para gravações, com modo espelhado e controle pelo celular.",
            after=0.8,
        ),
        *section("FORMAÇÃO"),
        Paragraph(
            "Cinema e Audiovisual | Belas Artes | São Paulo | fev. 2026 - conclusão prevista fev. 2030<br/>"
            "Game Development | Ontario College Advanced Diploma | Centennial College | Toronto | jan. 2021 - dez. 2023",
            STYLES["education"],
        ),
        *section("COMPETÊNCIAS E DISPONIBILIDADE"),
        Paragraph(
            "Captação e set: câmeras digitais, Sony A6400, iluminação Godox, softboxes, tripés, teleprompter, monitor de direção, logística de equipamentos e organização de mídia.<br/>"
            "Pós-produção: DaVinci Resolve; Adobe Premiere - experiência prática; tratamento de imagem, legendagem e organização de arquivos.<br/>"
            "Direção de arte e 3D: Maya, Cinema 4D, Substance Painter, Redshift e Unity. Idiomas: português nativo e inglês fluente.<br/>"
            "Disponibilidade: externas, fins de semana, madrugadas e viagens. CLT, estágio, PJ, projetos e diárias. CNPJ para emissão de nota.",
            STYLES["skill"],
        ),
    ]

    doc.build(story, onFirstPage=draw_page, onLaterPages=draw_page)
    print(output)


def main():
    parser = ArgumentParser(description="Gera o currículo audiovisual em PDF.")
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help=f"Arquivo de saída (padrão: {DEFAULT_OUTPUT})",
    )
    args = parser.parse_args()
    build(args.output.resolve())


if __name__ == "__main__":
    main()
