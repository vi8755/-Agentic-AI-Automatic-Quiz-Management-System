from langchain_core.tools import tool
import pandas as pd


@tool
def read_students_excel(file_path: str):
    """
    Read student data from an Excel file.
    """

    df = pd.read_excel(
        file_path,
        engine="openpyxl"
    )

    # Remove extra spaces from column names
    df.columns = df.columns.str.strip()

    # Remove completely empty rows
    df = df.dropna(how="all")

    # Clean values
    df["Name"] = df["Name"].fillna("").astype(str).str.strip()
    df["Roll No"] = df["Roll No"].fillna("").astype(str).str.strip()
    df["Email"] = df["Email"].fillna("").astype(str).str.strip()
    df["Department"] = df["Department"].fillna("").astype(str).str.strip()

    # Remove rows without an email
    df = df[df["Email"] != ""]

    students = df.to_dict(orient="records")

 

    return students